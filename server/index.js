import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRoom, upsertRoom, listCodes, seedDemoIfNeeded } from "./store.js";
import { createEmptyRoom, addParticipant, addWish } from "./roomFactory.js";
import { isValidRoomCode, normalizeCode } from "../shared/ids.js";
import { generateRoomCode } from "../shared/codes.js";
import {
  scheduleItinerary,
  applyAiSchedule,
  attachMatches,
  detectConflicts,
  presenceByDay,
  interpretWish,
} from "../shared/engine.js";
import { venuesForWish } from "../shared/places.js";
import { geminiInterpret, geminiSchedule, getGeminiKey } from "./gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

seedDemoIfNeeded();

function publicRoom(room) {
  const { wishlist, matches } = attachMatches(room.wishlist || []);
  const presence = presenceByDay(room);
  return {
    ...room,
    wishlist,
    matches,
    presence,
    conflicts: detectConflicts(room),
  };
}

function requireRoom(req, res) {
  const code = normalizeCode(req.params.code);
  if (!isValidRoomCode(code)) {
    res.status(400).json({ error: "That is not a valid trip code." });
    return null;
  }
  const room = getRoom(code);
  if (!room) {
    res.status(404).json({ error: "No trip found with that code." });
    return null;
  }
  return room;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "tripsync" });
});

app.post("/api/rooms", (req, res) => {
  const { trip_name, timezone, base_location, owner, code } = req.body || {};
  if (!trip_name || !owner?.name || !owner?.arrival || !owner?.departure) {
    res.status(400).json({ error: "Trip name, your name, arrival, and departure are required." });
    return;
  }
  let roomCode = code ? normalizeCode(code) : generateRoomCode(trip_name, listCodes());
  if (!isValidRoomCode(roomCode)) {
    res.status(400).json({ error: "Room codes must be 6–40 letters, numbers, or hyphens." });
    return;
  }
  if (getRoom(roomCode)) {
    if (code) {
      res.status(409).json({ error: "That trip code is already in use. Pick another." });
      return;
    }
    roomCode = generateRoomCode(trip_name, listCodes());
  }
  const room = createEmptyRoom({
    tripName: trip_name,
    timezone,
    baseLocation: base_location,
    owner,
    code: roomCode,
  });
  upsertRoom(room);
  res.status(201).json({ room: publicRoom(room), you: room.participants[0] });
});

app.get("/api/rooms/:code", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  res.json({ room: publicRoom(room) });
});

app.patch("/api/rooms/:code", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const next = { ...room };
  if (req.body.trip_name) next.trip_name = String(req.body.trip_name).slice(0, 80);
  if (req.body.timezone) next.timezone = req.body.timezone;
  if (req.body.base_location) next.base_location = { ...next.base_location, ...req.body.base_location };
  upsertRoom(next);
  res.json({ room: publicRoom(next) });
});

app.post("/api/rooms/:code/participants", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const { name, arrival, departure } = req.body || {};
  if (!name || !arrival || !departure) {
    res.status(400).json({ error: "Name, arrival, and departure are required to join." });
    return;
  }
  const existing = room.participants.find((p) => p.name.trim().toLowerCase() === String(name).trim().toLowerCase());
  if (existing) {
    const updated = {
      ...room,
      participants: room.participants.map((p) =>
        p.id === existing.id
          ? {
              ...p,
              arrival,
              departure,
              preferences: req.body.preferences || p.preferences,
              dietary: req.body.dietary || p.dietary,
              activities: req.body.activities || p.activities,
              arrival_location: req.body.arrival_location || p.arrival_location,
              departure_location: req.body.departure_location || p.departure_location,
            }
          : p,
      ),
    };
    upsertRoom(updated);
    const you = updated.participants.find((p) => p.id === existing.id);
    res.json({ room: publicRoom(updated), you, appeared: false });
    return;
  }
  const { room: next, participant } = addParticipant(room, req.body);
  upsertRoom(next);
  res.status(201).json({ room: publicRoom(next), you: participant, appeared: true });
});

app.patch("/api/rooms/:code/participants/:pid", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const next = {
    ...room,
    participants: room.participants.map((p) => (p.id === req.params.pid ? { ...p, ...req.body, id: p.id, avatar: p.avatar } : p)),
  };
  upsertRoom(next);
  res.json({ room: publicRoom(next) });
});

app.post("/api/rooms/:code/wishlist", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const actor = req.body.created_by || room.participants[0]?.id;
  const { room: next, wish } = addWish(room, req.body, actor);
  next.wishlist = next.wishlist.map((w) =>
    w.id === wish.id ? { ...w, candidate_venues: venuesForWish(w, next.base_location) } : w,
  );
  upsertRoom(next);
  res.status(201).json({ room: publicRoom(next), wish });
});

app.post("/api/rooms/:code/wishlist/:wid/heart", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const pid = req.body.participant_id;
  const next = {
    ...room,
    wishlist: room.wishlist.map((w) => {
      if (w.id !== req.params.wid) return w;
      const set = new Set(w.participants_interested || []);
      if (set.has(pid)) set.delete(pid);
      else set.add(pid);
      return { ...w, participants_interested: [...set] };
    }),
  };
  upsertRoom(next);
  res.json({ room: publicRoom(next) });
});

app.delete("/api/rooms/:code/wishlist/:wid", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const next = {
    ...room,
    wishlist: room.wishlist.filter((w) => w.id !== req.params.wid),
    events: room.events.filter((e) => e.wishlist_id !== req.params.wid || e.locked),
  };
  upsertRoom(next);
  res.json({ room: publicRoom(next) });
});

app.patch("/api/rooms/:code/events/:eid", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const next = {
    ...room,
    events: room.events.map((e) => (e.id === req.params.eid ? { ...e, ...req.body, id: e.id } : e)),
  };
  const conflicts = detectConflicts(next);
  upsertRoom(next);
  res.json({ room: publicRoom(next), conflicts });
});

app.delete("/api/rooms/:code/events/:eid", (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const next = { ...room, events: room.events.filter((e) => e.id !== req.params.eid) };
  upsertRoom(next);
  res.json({ room: publicRoom(next) });
});

app.post("/api/rooms/:code/interpret", async (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const text = req.body.text || "";
  const typeHint = req.body.type || "";
  const key = getGeminiKey(req);
  try {
    const ai = await geminiInterpret(key, text, typeHint);
    res.json({ intent: ai || interpretWish(text, typeHint), source: ai ? "gemini" : "local" });
  } catch {
    res.json({ intent: interpretWish(text, typeHint), source: "local" });
  }
});

app.post("/api/rooms/:code/optimize", async (req, res) => {
  const room = requireRoom(req, res);
  if (!room) return;
  const scope = req.body.scope || "all";
  const options = {
    scope,
    date: req.body.date,
    eventId: req.body.event_id,
    block: req.body.block,
  };

  const { wishlist, matches } = attachMatches(room.wishlist || []);
  const withVenues = {
    ...room,
    wishlist: wishlist.map((w) => ({ ...w, candidate_venues: venuesForWish(w, room.base_location) })),
  };

  let result;
  const key = getGeminiKey(req);
  if (key && (scope === "all" || scope === "unlocked")) {
    try {
      const ai = await geminiSchedule(key, {
        trip_name: withVenues.trip_name,
        timezone: withVenues.timezone,
        base_location: withVenues.base_location,
        participants: withVenues.participants.map((p) => ({
          id: p.id,
          name: p.name,
          arrival: p.arrival,
          departure: p.departure,
        })),
        presence: presenceByDay(withVenues),
        matches,
        locked_events: withVenues.events.filter((e) => e.locked),
        current_events: withVenues.events,
        wishlist: withVenues.wishlist,
        scope,
      });
      if (ai?.changes) result = applyAiSchedule(withVenues, ai);
    } catch {
      result = null;
    }
  }
  if (!result) result = scheduleItinerary(withVenues, options);

  const next = {
    ...withVenues,
    events: result.events,
    last_optimization: {
      at: new Date().toISOString(),
      summary: result.summary,
      changes: result.changes,
    },
  };
  upsertRoom(next);
  res.json({ room: publicRoom(next), optimization: next.last_optimization });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TripSync API on http://0.0.0.0:${PORT}`);
});

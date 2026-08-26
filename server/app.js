import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, mapsKey } from "./env.js";
import { getRoom, upsertRoom, listCodes, seedDemoIfNeeded, storageMode } from "./store.js";
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
  isoDay,
} from "../shared/engine.js";
import {
  mapsEnabled,
  enrichBaseLocation,
  enrichWishVenues,
  attachTravelTimes,
} from "./maps.js";
import { geminiInterpret, geminiSchedule, getGeminiKey } from "./gemini.js";

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function requireRoom(req, res) {
  const code = normalizeCode(req.params.code);
  if (!isValidRoomCode(code)) {
    res.status(400).json({ error: "That is not a valid trip code." });
    return null;
  }
  const room = await getRoom(code);
  if (!room) {
    res.status(404).json({ error: "No trip found with that code." });
    return null;
  }
  return room;
}

let seeded = false;
async function ensureSeed() {
  if (seeded) return;
  try {
    await seedDemoIfNeeded();
    seeded = true;
  } catch (err) {
    console.warn("Seed skipped:", err.message);
  }
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(async (_req, _res, next) => {
    await ensureSeed();
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      name: "tripsync",
      storage: storageMode(),
      maps: mapsEnabled(),
    });
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      mapsKey: mapsKey(),
      maps: mapsEnabled(),
      storage: storageMode(),
    });
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const { trip_name, timezone, base_location, owner, code } = req.body || {};
      if (!trip_name || !owner?.name || !owner?.arrival || !owner?.departure) {
        res.status(400).json({ error: "Trip name, your name, arrival, and departure are required." });
        return;
      }
      const existing = await listCodes();
      let roomCode = code ? normalizeCode(code) : generateRoomCode(trip_name, existing);
      if (!isValidRoomCode(roomCode)) {
        res.status(400).json({ error: "Room codes must be 6–40 letters, numbers, or hyphens." });
        return;
      }
      if (await getRoom(roomCode)) {
        if (code) {
          res.status(409).json({ error: "That trip code is already in use. Pick another." });
          return;
        }
        roomCode = generateRoomCode(trip_name, existing);
      }
      const room = createEmptyRoom({
        tripName: trip_name,
        timezone,
        baseLocation: await enrichBaseLocation(base_location || {}),
        owner,
        code: roomCode,
      });
      await upsertRoom(room);
      res.status(201).json({ room: publicRoom(room), you: room.participants[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/rooms/:code", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      res.json({ room: publicRoom(room) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/rooms/:code", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const next = { ...room };
      if (req.body.trip_name) next.trip_name = String(req.body.trip_name).slice(0, 80);
      if (req.body.timezone) next.timezone = req.body.timezone;
      if (req.body.base_location) {
        next.base_location = await enrichBaseLocation({ ...next.base_location, ...req.body.base_location });
      }
      await upsertRoom(next);
      res.json({ room: publicRoom(next) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rooms/:code/participants", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const { name, arrival, departure } = req.body || {};
      if (!name || !arrival || !departure) {
        res.status(400).json({ error: "Name, arrival, and departure are required to join." });
        return;
      }
      const existing = room.participants.find(
        (p) => p.name.trim().toLowerCase() === String(name).trim().toLowerCase(),
      );
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
        await upsertRoom(updated);
        const you = updated.participants.find((p) => p.id === existing.id);
        res.json({ room: publicRoom(updated), you, appeared: false });
        return;
      }
      const { room: next, participant } = addParticipant(room, req.body);
      await upsertRoom(next);
      res.status(201).json({ room: publicRoom(next), you: participant, appeared: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/rooms/:code/participants/:pid", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const next = {
        ...room,
        participants: room.participants.map((p) =>
          p.id === req.params.pid ? { ...p, ...req.body, id: p.id, avatar: p.avatar } : p,
        ),
      };
      await upsertRoom(next);
      res.json({ room: publicRoom(next) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rooms/:code/wishlist", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const actor = req.body.created_by || room.participants[0]?.id;
      const { room: next, wish } = addWish(room, req.body, actor);
      const venues = await enrichWishVenues(wish, next.base_location);
      next.wishlist = next.wishlist.map((w) => (w.id === wish.id ? { ...w, candidate_venues: venues } : w));
      await upsertRoom(next);
      res.status(201).json({ room: publicRoom(next), wish: { ...wish, candidate_venues: venues } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rooms/:code/wishlist/:wid/heart", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
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
      await upsertRoom(next);
      res.json({ room: publicRoom(next) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/rooms/:code/wishlist/:wid", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const next = {
        ...room,
        wishlist: room.wishlist.filter((w) => w.id !== req.params.wid),
        events: room.events.filter((e) => e.wishlist_id !== req.params.wid || e.locked),
      };
      await upsertRoom(next);
      res.json({ room: publicRoom(next) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/rooms/:code/events/:eid", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const next = {
        ...room,
        events: room.events.map((e) => (e.id === req.params.eid ? { ...e, ...req.body, id: e.id } : e)),
      };
      const conflicts = detectConflicts(next);
      await upsertRoom(next);
      res.json({ room: publicRoom(next), conflicts });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/rooms/:code/events/:eid", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const next = { ...room, events: room.events.filter((e) => e.id !== req.params.eid) };
      await upsertRoom(next);
      res.json({ room: publicRoom(next) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rooms/:code/interpret", async (req, res) => {
    const room = await requireRoom(req, res);
    if (!room) return;
    const text = req.body.text || "";
    const typeHint = req.body.type || "";
    const gemKey = getGeminiKey(req);
    try {
      const ai = await geminiInterpret(gemKey, text, typeHint);
      res.json({ intent: ai || interpretWish(text, typeHint), source: ai ? "gemini" : "local" });
    } catch {
      res.json({ intent: interpretWish(text, typeHint), source: "local" });
    }
  });

  app.post("/api/rooms/:code/optimize", async (req, res) => {
    try {
      const room = await requireRoom(req, res);
      if (!room) return;
      const scope = req.body.scope || "all";
      const options = {
        scope,
        date: req.body.date,
        eventId: req.body.event_id,
        block: req.body.block,
      };

      const base = await enrichBaseLocation(room.base_location || {});
      const { wishlist, matches } = attachMatches(room.wishlist || []);
      const wishlistWithVenues = [];
      for (const w of wishlist) {
        const candidate_venues =
          w.candidate_venues?.length && mapsEnabled() === false
            ? w.candidate_venues
            : await enrichWishVenues(w, base);
        wishlistWithVenues.push({ ...w, candidate_venues });
      }

      const withVenues = { ...room, base_location: base, wishlist: wishlistWithVenues };

      let result;
      const gemKey = getGeminiKey(req);
      if (gemKey && (scope === "all" || scope === "unlocked")) {
        try {
          const ai = await geminiSchedule(gemKey, {
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
      const tz = withVenues.timezone || "Asia/Kuala_Lumpur";
      result.events = await attachTravelTimes(result.events, (iso) => isoDay(iso, tz));

      const next = {
        ...withVenues,
        events: result.events,
        last_optimization: {
          at: new Date().toISOString(),
          summary: result.summary,
          changes: result.changes,
          maps: mapsEnabled(),
        },
      };
      await upsertRoom(next);
      res.json({ room: publicRoom(next), optimization: next.last_optimization });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  if (!process.env.VERCEL) {
    const dist = path.join(__dirname, "..", "dist");
    if (fs.existsSync(dist)) {
      app.use(express.static(dist));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(dist, "index.html"));
      });
    }
  }

  return app;
}

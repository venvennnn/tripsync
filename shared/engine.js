import { makeId } from "./ids.js";
import { detectGroupMatches, clusterIdsForText, extractIntent } from "./intent.js";
import {
  estimateTravelMinutes,
  estimateWalkMinutes,
  haversineKm,
  parseMapsCoords,
  proximityBonus,
  venuesForWish,
  WALK_KM,
  NEIGHBORHOOD_KM,
} from "./places.js";

export const BLOCKS = [
  { id: "breakfast", label: "Breakfast", start: "08:00", end: "09:30", meal: true, food: ["breakfast", "coffee", "cafe"] },
  { id: "morning", label: "Morning", start: "10:00", end: "12:00", meal: false, food: ["coffee", "cafe", "browse"] },
  { id: "lunch", label: "Lunch", start: "12:30", end: "14:00", meal: true, food: ["lunch"] },
  { id: "afternoon", label: "Afternoon", start: "15:00", end: "17:00", meal: false, food: ["explore", "browse", "coffee"] },
  { id: "evening", label: "Evening", start: "17:30", end: "19:00", meal: false, food: ["walk", "browse", "night", "speakeasy", "bar"] },
  { id: "dinner", label: "Dinner", start: "19:30", end: "21:30", meal: true, food: ["dinner"] },
];

export const PRIORITY_RANK = {
  must_do: 4,
  would_love: 3,
  nice_to_have: 2,
  optional: 1,
};

export function asDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function isoDay(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(asDate(date));
}

export function combineLocal(day, hhmm, timeZone) {
  const [h, m] = hhmm.split(":").map(Number);
  const guess = new Date(`${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const tzDate = new Date(guess.toLocaleString("en-US", { timeZone }));
  const offset = guess.getTime() - tzDate.getTime();
  return new Date(guess.getTime() + offset);
}

export function participantPresent(participant, start, end) {
  const a = asDate(participant.arrival);
  const d = asDate(participant.departure);
  const s = asDate(start);
  const e = asDate(end);
  if (!a || !d || !s || !e) return false;
  return s >= a && e <= d;
}

export function presentParticipants(participants, start, end) {
  return participants.filter((p) => participantPresent(p, start, end));
}

export function tripSpan(participants) {
  const arrivals = participants.map((p) => asDate(p.arrival)).filter(Boolean);
  const deps = participants.map((p) => asDate(p.departure)).filter(Boolean);
  if (!arrivals.length) return null;
  return { start: new Date(Math.min(...arrivals)), end: new Date(Math.max(...deps)) };
}

export function eachDay(start, end, timeZone) {
  const days = [];
  if (!start || !end) return days;
  const cursor = new Date(isoDay(start, timeZone) + "T12:00:00");
  const last = new Date(isoDay(end, timeZone) + "T12:00:00");
  while (cursor <= last) {
    days.push(isoDay(cursor, "UTC"));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function fullGroupWindow(participants) {
  if (!participants.length) return null;
  const start = new Date(Math.max(...participants.map((p) => asDate(p.arrival)?.getTime() || 0)));
  const end = new Date(Math.min(...participants.map((p) => asDate(p.departure)?.getTime() || Infinity)));
  if (start < end) return { start, end };
  return null;
}

export function overlapAt(participants, start, end) {
  const present = presentParticipants(participants, start, end);
  return {
    present,
    count: present.length,
    isFull: present.length === participants.length && participants.length > 0,
    isSolo: present.length === 1,
    isPair: present.length === 2,
  };
}

function preferredBlock(wish) {
  if (isWalkWish(wish) && (!wish.preferred_time || wish.preferred_time === "any")) {
    return BLOCKS.find((b) => b.id === "evening") || BLOCKS.at(-1);
  }
  if (wish.preferred_time && wish.preferred_time !== "any") {
    return BLOCKS.find((b) => b.id === wish.preferred_time) || null;
  }
  const blob = `${wish.title} ${wish.query} ${wish.intent} ${(wish.clusters || []).join(" ")}`.toLowerCase();
  if (/walk|stroll|wander/.test(blob)) return BLOCKS.find((b) => b.id === "evening");
  if (/coffee|cafe|breakfast/.test(blob)) return BLOCKS.find((b) => b.id === "breakfast") || BLOCKS[0];
  if (/lunch/.test(blob) || wish.type === "cuisine") return BLOCKS.find((b) => b.id === "lunch");
  if (/dinner|mala|hotpot/.test(blob)) return BLOCKS.find((b) => b.id === "dinner");
  if (/night|speak|bar/.test(blob)) return BLOCKS.find((b) => b.id === "evening");
  if (wish.type === "hipster") return BLOCKS.find((b) => b.id === "afternoon");
  return null;
}

function isMealWish(wish) {
  if (isWalkWish(wish)) return false;
  return wish.type === "cuisine" || /food|eat|lunch|dinner|breakfast|rice|curry|pasta|coffee/.test(
    `${wish.title} ${wish.query}`.toLowerCase(),
  );
}

export function isWalkWish(wish) {
  return wish?.type === "walk" || wish?.kind === "walking_tour";
}

export function walkStopsFor(wish) {
  const stops = [];
  const push = (s) => {
    if (!s) return;
    const title = s.title || s.name;
    if (!title && !s.maps_url && s.lat == null && s.lng == null) return;
    stops.push({
      name: title || "Stop",
      title: title || "Stop",
      address: s.address || "",
      maps_url: s.maps_url || null,
      lat: s.lat ?? null,
      lng: s.lng ?? null,
    });
  };
  push(wish.walk_from);
  for (const s of wish.walk_via || []) push(s);
  push(wish.walk_to);
  return stops;
}

function interestedIds(wish) {
  const set = new Set(wish.participants_interested || []);
  if (wish.created_by) set.add(wish.created_by);
  return [...set];
}

function allInterestedPresent(wish, present) {
  const need = new Set(wish.required_participants?.length ? wish.required_participants : interestedIds(wish));
  const ids = new Set(present.map((p) => p.id));
  for (const id of need) {
    if (!ids.has(id)) return false;
  }
  return need.size > 0;
}

function slotKey(day, blockId) {
  return `${day}|${blockId}`;
}

function enrichWish(wish) {
  const clusters = wish.clusters?.length
    ? wish.clusters
    : clusterIdsForText(`${wish.title} ${wish.query} ${wish.intent || ""}`);
  return { ...wish, clusters };
}

export function attachMatches(wishlist) {
  const enriched = wishlist.map(enrichWish);
  const matches = detectGroupMatches(enriched);
  const matchByWish = new Map();
  for (const m of matches) {
    for (const id of m.wish_ids) {
      if (!matchByWish.has(id)) matchByWish.set(id, []);
      matchByWish.get(id).push(m);
    }
  }
  return {
    wishlist: enriched.map((w) => ({
      ...w,
      group_match: (matchByWish.get(w.id) || []).length > 0,
      matches: matchByWish.get(w.id) || [],
    })),
    matches,
  };
}

export function detectConflicts(room) {
  const conflicts = [];
  const { participants = [], events = [] } = room;
  for (const event of events) {
    if (!event.start || !event.end) continue;
    for (const pid of event.participants || []) {
      const p = participants.find((x) => x.id === pid);
      if (!p) continue;
      if (!participantPresent(p, event.start, event.end)) {
        conflicts.push({
          event_id: event.id,
          participant_id: pid,
          code: "outside_window",
          message: `${p.name} is not around for ${event.title}.`,
        });
      }
    }
  }
  return conflicts;
}

function venueFor(wish, room) {
  if (isWalkWish(wish)) {
    const stops = walkStopsFor(wish);
    const pinned = stops.find((s) => s.lat != null && s.lng != null) || stops[0];
    if (pinned) {
      return {
        name: pinned.name,
        address: pinned.address || "",
        maps_url: pinned.maps_url || wish.maps_url || null,
        lat: pinned.lat ?? null,
        lng: pinned.lng ?? null,
      };
    }
  }
  if (wish.venue?.lat != null && wish.venue?.lng != null) return wish.venue;
  const parsed = parseMapsCoords(wish.maps_url);
  const ownLat = wish.lat ?? wish.venue?.lat ?? parsed?.lat ?? null;
  const ownLng = wish.lng ?? wish.venue?.lng ?? parsed?.lng ?? null;
  if (ownLat != null && ownLng != null) {
    return {
      name: wish.venue?.name || wish.title,
      address: wish.address || wish.venue?.address || "",
      maps_url: wish.maps_url || wish.venue?.maps_url || null,
      lat: ownLat,
      lng: ownLng,
    };
  }
  const candidate =
    (wish.candidate_venues || []).find((v) => v.lat != null && v.lng != null) || wish.candidate_venues?.[0];
  if (candidate?.lat != null && candidate?.lng != null) {
    return {
      name: candidate.name || wish.title,
      address: candidate.address || "",
      maps_url: candidate.maps_url || wish.maps_url || null,
      lat: candidate.lat,
      lng: candidate.lng,
      vibe: candidate.vibe || "",
    };
  }
  if (wish.maps_url) {
    return {
      name: wish.title,
      address: wish.address || "",
      maps_url: wish.maps_url,
      lat: null,
      lng: null,
    };
  }
  const found = venuesForWish(wish, room.base_location)[0];
  if (found) {
    return {
      name: found.name,
      address: `${found.neighborhood}, ${found.city}`,
      maps_url: found.maps_url,
      lat: found.lat,
      lng: found.lng,
      vibe: found.vibe,
    };
  }
  return { name: wish.title, address: "", maps_url: wish.maps_url || null, lat: wish.lat || null, lng: wish.lng || null };
}

function explain(wish, slot, present, room, groupWindow) {
  const names = present.map((p) => p.name);
  const bits = [];
  if (present.length === room.participants.length && room.participants.length > 1) {
    bits.push(`all ${present.length} travelers are around`);
  } else {
    bits.push(`${names.join(", ") || "the interested travelers"} can make it`);
  }
  if (wish.group_match) bits.push("this looks like a group match across wishlists");
  if (isWalkWish(wish)) bits.push("it is a walking session from one pin to the next");
  if (slot.block.meal && isMealWish(wish)) bits.push(`${slot.block.label.toLowerCase()} is the right meal window`);
  if (groupWindow && asDate(slot.start) >= groupWindow.start && asDate(slot.end) <= groupWindow.end && wish.group_match) {
    bits.push("it sits inside the full-group overlap");
  }
  if (interestedIds(wish).length === 1 && present.length === 1) {
    bits.push("kept out of a crowded group slot so shared time stays free");
  }
  return `${wish.title} is scheduled ${slot.block.label.toLowerCase()} because ${bits.join(", and ")}.`;
}

function listCandidateSlots(room, occupied, scope) {
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const span = tripSpan(room.participants);
  if (!span) return [];
  const days = eachDay(span.start, span.end, tz);
  const slots = [];
  for (const day of days) {
    if (scope?.date && scope.date !== day) continue;
    for (const block of BLOCKS) {
      if (scope?.block && scope.block !== block.id) continue;
      const start = combineLocal(day, block.start, tz);
      const end = combineLocal(day, block.end, tz);
      const key = slotKey(day, block.id);
      if (occupied.has(key) && !scope?.allowOccupied) continue;
      slots.push({ day, block, start, end, key });
    }
  }
  return slots;
}

function dayVenues(events, day) {
  return (events || [])
    .filter((e) => e.start && e.start.slice(0, 10) === day)
    .flatMap((e) => (e.stops?.length ? e.stops : [e.venue]))
    .filter((v) => v?.lat != null && v?.lng != null);
}

function sessionPackBonus(slot, venue, events) {
  const sameDay = (events || []).filter((e) => e.start && e.start.slice(0, 10) === slot.day);
  if (!sameDay.length) return 0;
  const idx = BLOCKS.findIndex((b) => b.id === slot.block.id);
  const neighborIds = [BLOCKS[idx - 1]?.id, BLOCKS[idx + 1]?.id].filter(Boolean);
  const neighbors = sameDay.filter((e) => neighborIds.includes(e.block));
  const neighborVenues = neighbors.flatMap((e) => (e.stops?.length ? e.stops : [e.venue]));
  const nearSession = proximityBonus(venue, neighborVenues);
  if (nearSession >= 34) return 22;
  if (nearSession >= 16) return 10;
  return 0;
}

function scoreSlot(wish, slot, room, groupWindow, previousVenue, dayEvents = []) {
  const present = presentParticipants(room.participants, slot.start, slot.end);
  if (!allInterestedPresent(wish, present)) return { score: -Infinity, present };

  let score = 0;
  const interested = interestedIds(wish);
  const presentInterested = present.filter((p) => interested.includes(p.id));
  score += presentInterested.length * 18;
  score += present.length * 4;
  score += (PRIORITY_RANK[wish.priority] || 1) * 12;

  const inGroup =
    groupWindow && slot.start >= groupWindow.start && slot.end <= groupWindow.end;
  const groupValue = wish.group_match || (isMealWish(wish) && interested.length >= 1 && wish.priority !== "optional");

  if (groupValue && inGroup) score += 36;
  if (groupValue && present.length === room.participants.length) score += 28;
  if (!groupValue && interested.length === 1) {
    if (inGroup) score -= 22;
    if (present.length === 1) score += 24;
    else score += 4;
  }

  const pref = preferredBlock(wish);
  if (pref && pref.id === slot.block.id) score += 26;
  else if (pref && slot.block.meal === pref.meal) score += 8;
  if (isMealWish(wish) && slot.block.meal) score += 10;
  if (!isMealWish(wish) && wish.type === "hipster" && ["morning", "afternoon", "evening"].includes(slot.block.id)) {
    score += 12;
  }
  if (isWalkWish(wish) && ["afternoon", "evening"].includes(slot.block.id)) score += 14;

  const venue = venueFor(wish, room);
  const travel = estimateTravelMinutes(previousVenue, venue);
  if (travel != null) score -= Math.min(30, travel / 2);
  const others = [...dayVenues(dayEvents, slot.day), previousVenue].filter(Boolean);
  score += proximityBonus(venue, others);
  score += sessionPackBonus(slot, venue, dayEvents);

  return { score, present, travel, venue, inGroup };
}

function previousVenueForDay(events, day, beforeStart) {
  const sameDay = events
    .filter((e) => e.start && isoDay(e.start, "UTC") === day && asDate(e.start) < asDate(beforeStart))
    .sort((a, b) => asDate(a.start) - asDate(b.start));
  const last = sameDay.at(-1);
  return last?.venue || null;
}

export function enforceHardConstraints(room, proposedEvents) {
  const kept = [];
  const dropped = [];
  for (const event of proposedEvents) {
    if (event.locked) {
      kept.push(event);
      continue;
    }
    const people = (event.participants || [])
      .map((id) => room.participants.find((p) => p.id === id))
      .filter(Boolean);
    const invalid = people.filter((p) => !participantPresent(p, event.start, event.end));
    if (invalid.length) {
      dropped.push({ event, reason: `excluded ${invalid.map((p) => p.name).join(", ")}` });
      continue;
    }
    kept.push(event);
  }
  return { events: kept, dropped };
}

export function scheduleItinerary(room, options = {}) {
  const scope = options.scope || "all";
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const { wishlist, matches } = attachMatches(room.wishlist || []);
  const groupWindow = fullGroupWindow(room.participants || []);

  const locked = (room.events || []).filter((e) => e.locked);
  const keepUnlocked =
    scope === "event" || scope === "day" || scope === "block"
      ? (room.events || []).filter((e) => {
          if (e.locked) return false;
          if (scope === "event" && e.id !== options.eventId) return true;
          if (scope === "day" && isoDay(e.start, tz) !== options.date) return true;
          if (scope === "block") {
            const day = isoDay(e.start, tz);
            return !(day === options.date && e.block === options.block);
          }
          return true;
        })
      : [];

  const preserved = [...locked, ...keepUnlocked];
  const occupied = new Set(
    preserved
      .filter((e) => e.start && e.block)
      .map((e) => slotKey(isoDay(e.start, tz), e.block)),
  );

  const scheduledWishIds = new Set(preserved.map((e) => e.wishlist_id).filter(Boolean));
  const toPlace = wishlist
    .filter((w) => {
      if (scheduledWishIds.has(w.id) && scope !== "event") return false;
      if (scope === "event") {
        const target = (room.events || []).find((e) => e.id === options.eventId);
        return target?.wishlist_id === w.id;
      }
      return true;
    })
    .sort((a, b) => {
      const pa = PRIORITY_RANK[a.priority] || 0;
      const pb = PRIORITY_RANK[b.priority] || 0;
      if (pb !== pa) return pb - pa;
      const wa = isWalkWish(a) ? 2 : 0;
      const wb = isWalkWish(b) ? 2 : 0;
      if (wb !== wa) return wb - wa;
      const ia = interestedIds(a).length + (a.group_match ? 3 : 0);
      const ib = interestedIds(b).length + (b.group_match ? 3 : 0);
      return ib - ia;
    });

  const created = [];
  const changes = [];

  for (const wish of toPlace) {
    const slots = listCandidateSlots(
      room,
      occupied,
      scope === "day" ? { date: options.date } : scope === "block" ? { date: options.date, block: options.block } : {},
    );
    let best = null;
    for (const slot of slots) {
      const placed = [...preserved, ...created];
      const prev = previousVenueForDay(placed, slot.day, slot.start);
      const scored = scoreSlot(wish, slot, room, groupWindow, prev, placed);
      if (!best || scored.score > best.scored.score) best = { slot, scored };
    }
    if (!best || best.scored.score === -Infinity) {
      changes.push({
        wishlist_id: wish.id,
        action: "skipped",
        reason: "No slot where the interested travelers are all present.",
      });
      continue;
    }

    const stops = isWalkWish(wish) ? walkStopsFor(wish) : [];
    const event = {
      id: makeId("e"),
      wishlist_id: wish.id,
      title: wish.title,
      venue: best.scored.venue,
      start: best.slot.start.toISOString(),
      end: best.slot.end.toISOString(),
      block: best.slot.block.id,
      participants: best.scored.present.map((p) => p.id),
      locked: false,
      reason: explain(wish, best.slot, best.scored.present, room, groupWindow),
      travel_from_previous_min: best.scored.travel,
      group_match: Boolean(wish.group_match),
      priority: wish.priority,
      created_by: wish.created_by,
      kind: isWalkWish(wish) ? "walking_tour" : "stop",
      stops,
      session: isWalkWish(wish)
        ? `${best.slot.block.label} walk`
        : proximityBonus(best.scored.venue, dayVenues([...preserved, ...created], best.slot.day)) >= 16
          ? `${best.slot.day} cluster`
          : null,
    };
    created.push(event);
    occupied.add(best.slot.key);
    changes.push({
      wishlist_id: wish.id,
      date: best.slot.day,
      start_time: best.slot.block.start,
      end_time: best.slot.block.end,
      participants: event.participants,
      reason: event.reason,
    });
  }

  let events = [...preserved, ...created].sort((a, b) => asDate(a.start) - asDate(b.start));
  events = events.map((event, i) => {
    const prev = events[i - 1];
    if (!prev || isoDay(prev.start, tz) !== isoDay(event.start, tz)) {
      return { ...event, travel_from_previous_min: null, travel_from_previous: null };
    }
    return { ...event, ...travelBetween(prev, event) };
  });

  const { events: safeEvents, dropped } = enforceHardConstraints(room, events);
  for (const d of dropped) {
    changes.push({ action: "dropped", reason: d.reason, title: d.event.title });
  }

  const summary = buildSummary(room, safeEvents, changes, matches, groupWindow);
  return {
    events: safeEvents,
    changes,
    matches,
    summary,
    group_window: groupWindow
      ? { start: groupWindow.start.toISOString(), end: groupWindow.end.toISOString() }
      : null,
  };
}

function buildSummary(room, events, changes, matches, groupWindow) {
  const placed = changes.filter((c) => c.date).length;
  const skipped = changes.filter((c) => c.action === "skipped").length;
  const lines = [];
  if (placed) lines.push(`${placed} itinerary ${placed === 1 ? "stop" : "stops"} placed.`);
  if (matches.length) {
    lines.push(
      `Group match: ${matches.length} shared ${matches.length === 1 ? "theme" : "themes"} (${matches
        .map((m) => m.label)
        .join(", ")}).`,
    );
  }
  if (groupWindow) {
    lines.push(
      `Full-group window ${isoDay(groupWindow.start, room.timezone)} → ${isoDay(groupWindow.end, room.timezone)}.`,
    );
  }
  if (skipped) lines.push(`${skipped} wish${skipped === 1 ? "" : "es"} could not fit without breaking availability.`);
  const walkCount = events.filter((e) => e.kind === "walking_tour").length;
  if (walkCount) lines.push(`${walkCount} walking ${walkCount === 1 ? "session" : "sessions"} placed.`);
  const clusteredDays = new Set(
    events.filter((e) => e.session && e.kind !== "walking_tour").map((e) => e.start?.slice(0, 10)),
  );
  if (clusteredDays.size) lines.push(`Nearby stops were packed onto ${clusteredDays.size} day${clusteredDays.size === 1 ? "" : "s"}.`);
  const lockedCount = (room.events || []).filter((e) => e.locked).length;
  if (lockedCount) lines.push(`Kept ${lockedCount} pinned ${lockedCount === 1 ? "stop" : "stops"} in place.`);
  return {
    headline: placed ? "Trip optimized" : "No movable events yet",
    lines,
    change_count: placed,
    events_count: events.length,
  };
}

export function applyAiSchedule(room, payload) {
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const locked = (room.events || []).filter((e) => e.locked);
  const lockedWish = new Set(locked.map((e) => e.wishlist_id));
  const occupied = new Set(locked.filter((e) => e.block).map((e) => slotKey(isoDay(e.start, tz), e.block)));
  const created = [];
  const changes = [];

  for (const change of payload.changes || []) {
    const wish = (room.wishlist || []).find((w) => w.id === change.wishlist_id);
    if (!wish) continue;
    if (lockedWish.has(wish.id)) {
      changes.push({
        wishlist_id: wish.id,
        action: "kept",
        reason: "Locked event was left untouched.",
      });
      continue;
    }
    const day = change.date;
    const startHm = change.start_time || "12:30";
    const endHm = change.end_time || "14:00";
    const start = combineLocal(day, startHm, tz);
    const end = combineLocal(day, endHm, tz);
    const block =
      BLOCKS.find((b) => b.start === startHm)?.id ||
      BLOCKS.find((b) => startHm >= b.start && startHm < b.end)?.id ||
      "afternoon";
    const people = (change.participants || []).filter((id) =>
      room.participants.some((p) => p.id === id && participantPresent(p, start, end)),
    );
    const interested = interestedIds(wish).filter((id) =>
      room.participants.some((p) => p.id === id && participantPresent(p, start, end)),
    );
    const participants = people.length ? people : interested;
    if (!participants.length) continue;
    const key = slotKey(day, block);
    if (occupied.has(key)) continue;
    const event = {
      id: makeId("e"),
      wishlist_id: wish.id,
      title: wish.title,
      venue: venueFor(wish, room),
      start: start.toISOString(),
      end: end.toISOString(),
      block,
      participants,
      locked: false,
      reason: change.reason || "Scheduled from the optimization pass.",
      group_match: Boolean(wish.group_match),
      priority: wish.priority,
      created_by: wish.created_by,
      kind: isWalkWish(wish) ? "walking_tour" : "stop",
      stops: isWalkWish(wish) ? walkStopsFor(wish) : [],
    };
    created.push(event);
    occupied.add(key);
    changes.push(change);
  }

  const events = [...locked, ...created].sort((a, b) => asDate(a.start) - asDate(b.start));
  const safe = enforceHardConstraints(room, events);
  return {
    events: safe.events,
    changes,
    summary: {
      headline: "Trip optimized",
      lines: changes.map((c) => c.reason).filter(Boolean).slice(0, 6),
      change_count: changes.length,
      events_count: safe.events.length,
      source: "gemini",
    },
  };
}

export function interpretWish(text, typeHint) {
  return extractIntent(text, typeHint);
}

function travelBetween(prev, event) {
  const from = prev.stops?.length ? prev.stops.at(-1) : prev.venue;
  const to = event.stops?.length ? event.stops[0] : event.venue;
  const km = haversineKm(from, to);
  const drive = estimateTravelMinutes(from, to);
  if (drive == null) return { travel_from_previous_min: null, travel_from_previous: null };
  const walk = km != null && km <= WALK_KM;
  const walkMin = estimateWalkMinutes(from, to);
  return {
    travel_from_previous_min: walk ? walkMin : drive,
    travel_from_previous: {
      minutes: walk ? walkMin : drive,
      meters: km != null ? Math.round(km * 1000) : null,
      text: walk
        ? `${walkMin} min walk · ${km.toFixed(1)} km`
        : `${drive} min from previous stop`,
      source: walk ? "walk" : "estimate",
    },
  };
}

export const FAR_KM = 8;

export function eventVenue(event) {
  if (event?.stops?.length) return event.stops[0];
  return event?.venue || null;
}

export function distanceHint(room, event, date, blockId) {
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const venue = eventVenue(event);
  const sameDay = (room.events || []).filter(
    (e) => e.id !== event.id && e.start && isoDay(e.start, tz) === date,
  );
  const hops = [];
  for (const n of sameDay) {
    const km = haversineKm(venue, eventVenue(n));
    if (km != null) hops.push({ title: n.title, km, block: n.block });
  }
  hops.sort((a, b) => b.km - a.km);
  const worst = hops[0];
  if (!worst || worst.km < FAR_KM) return { far: false, warning: null, alternatives: [] };

  const span = tripSpan(room.participants || []);
  const days = span ? eachDay(span.start, span.end, tz) : [];
  const alternatives = [];
  for (const day of days) {
    if (day === date) continue;
    const dayEvents = (room.events || []).filter((e) => e.id !== event.id && e.start && isoDay(e.start, tz) === day);
    const venues = dayEvents.map(eventVenue).filter((v) => v?.lat != null);
    if (!venues.length) continue;
    const kms = venues.map((v) => haversineKm(venue, v)).filter((k) => k != null);
    const minKm = kms.length ? Math.min(...kms) : Infinity;
    if (!Number.isFinite(minKm) || minKm > NEIGHBORHOOD_KM) continue;
    const free = BLOCKS.find((b) => {
      if (day === date && b.id === blockId) return false;
      const occ = dayEvents.find((e) => e.block === b.id);
      return !occ || !occ.locked;
    });
    if (!free) continue;
    alternatives.push({
      date: day,
      block: free.id,
      km: minKm,
      reason: `Nearer ${dayEvents[0].title} (${minKm.toFixed(1)} km)`,
    });
  }
  alternatives.sort((a, b) => a.km - b.km);
  return {
    far: true,
    km: worst.km,
    warning: `${worst.km.toFixed(1)} km from “${worst.title}” that day — a crosstown hop.`,
    alternatives: alternatives.slice(0, 2),
  };
}

export function createSlotEvent(room, { date, block, title, maps_url, created_by, wish }) {
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const times = slotTimes(date, block, tz);
  const occupant = (room.events || []).find((e) => e.block === times.block && isoDay(e.start, tz) === date);
  if (occupant) return { error: `${occupant.title} is already in that slot.` };
  const parsed = parseMapsCoords(maps_url);
  const start = asDate(times.start);
  const end = asDate(times.end);
  const present = presentParticipants(room.participants || [], start, end);
  const event = {
    id: makeId("e"),
    wishlist_id: wish?.id || null,
    title: title || wish?.title || "Pinned stop",
    venue: {
      name: title || wish?.title || "Pinned stop",
      address: wish?.address || "",
      maps_url: maps_url || wish?.maps_url || null,
      lat: parsed?.lat ?? wish?.lat ?? null,
      lng: parsed?.lng ?? wish?.lng ?? null,
    },
    start: times.start,
    end: times.end,
    block: times.block,
    participants: present.map((p) => p.id),
    locked: true,
    kind: "stop",
    reason: `Pinned to ${BLOCKS.find((b) => b.id === block)?.label || block} — Re-Optimize will not move this.`,
    created_by: created_by || wish?.created_by || null,
    stops: [],
    priority: "must_do",
  };
  return { event };
}

export function slotTimes(date, blockId, timeZone) {
  const block = BLOCKS.find((b) => b.id === blockId) || BLOCKS[2];
  return {
    block: block.id,
    start: combineLocal(date, block.start, timeZone).toISOString(),
    end: combineLocal(date, block.end, timeZone).toISOString(),
  };
}

export function moveEventToBlock(room, eventId, date, blockId) {
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const times = slotTimes(date, blockId, tz);
  const target = (room.events || []).find((e) => e.id === eventId);
  if (!target) return { room, error: "Event not found." };
  if (target.locked) return { room, error: "Unpin this stop before moving it." };
  const occupant = (room.events || []).find(
    (e) => e.id !== eventId && e.block === times.block && isoDay(e.start, tz) === date,
  );
  if (occupant?.locked) return { room, error: `${occupant.title} is pinned in that slot.` };

  let events = (room.events || []).map((e) => {
    if (e.id === eventId) return { ...e, ...times };
    if (occupant && e.id === occupant.id) {
      return { ...e, start: target.start, end: target.end, block: target.block };
    }
    return e;
  });
  events.sort((a, b) => asDate(a.start) - asDate(b.start));
  events = events.map((event, i) => {
    const prev = events[i - 1];
    if (!prev || isoDay(prev.start, tz) !== isoDay(event.start, tz)) {
      return { ...event, travel_from_previous_min: null, travel_from_previous: null };
    }
    return { ...event, ...travelBetween(prev, event) };
  });
  const next = { ...room, events };
  const moved = next.events.find((e) => e.id === eventId);
  const hint = moved ? distanceHint(next, moved, date, blockId) : { far: false };
  return { room: next, conflicts: detectConflicts(next), swapped: Boolean(occupant), hint };
}

export function presenceByDay(room) {
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const span = tripSpan(room.participants || []);
  if (!span) return { days: [], rows: [], group: [] };
  const days = eachDay(span.start, span.end, tz);
  const rows = (room.participants || []).map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    cells: days.map((day) => {
      const start = combineLocal(day, "00:00", tz);
      const end = combineLocal(day, "23:59", tz);
      const clipStart = new Date(Math.max(start.getTime(), asDate(p.arrival).getTime()));
      const clipEnd = new Date(Math.min(end.getTime(), asDate(p.departure).getTime()));
      return clipEnd > clipStart;
    }),
  }));
  const group = days.map((_, i) => rows.every((r) => r.cells[i]));
  return { days, rows, group, window: fullGroupWindow(room.participants) };
}

export function eventsByDay(room) {
  const tz = room.timezone || "Asia/Kuala_Lumpur";
  const map = new Map();
  for (const event of room.events || []) {
    if (!event.start) continue;
    const day = isoDay(event.start, tz);
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(event);
  }
  for (const list of map.values()) list.sort((a, b) => asDate(a.start) - asDate(b.start));
  return map;
}

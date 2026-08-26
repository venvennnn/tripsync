import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateRoomCode, normalizeCode } from "./codes.js";
import { assignAvatar } from "./avatars.js";
import { extractMapsUrl, parseMapsCoords, scrapeMapsHtml, unwrapMapsContinueUrl, mapsPlaceQuery } from "./places.js";
import { extractIntent, detectGroupMatches } from "./intent.js";
import { pushVersion, restoreVersion } from "./versions.js";
import {
  participantPresent,
  fullGroupWindow,
  scheduleItinerary,
  detectConflicts,
  enforceHardConstraints,
  moveEventToBlock,
  isoDay,
} from "./engine.js";

const venmani = {
  id: "p1",
  name: "Venmani",
  arrival: "2026-08-29T09:00:00+08:00",
  departure: "2026-09-07T18:00:00+08:00",
};
const lynn = {
  id: "p2",
  name: "Lynn",
  arrival: "2026-08-30T10:00:00+08:00",
  departure: "2026-09-06T18:00:00+08:00",
};
const adila = {
  id: "p3",
  name: "Adila",
  arrival: "2026-08-31T09:00:00+08:00",
  departure: "2026-09-03T18:00:00+08:00",
};

function baseRoom(extra = {}) {
  return {
    code: "KL-FOOD-SQUAD-2026",
    trip_name: "KL Food Squad",
    timezone: "Asia/Kuala_Lumpur",
    base_location: { name: "Petaling Jaya Hotel", address: "Petaling Jaya, Malaysia" },
    participants: [venmani, lynn, adila],
    wishlist: [
      {
        id: "w1",
        created_by: "p1",
        title: "Banana Leaf Rice",
        type: "cuisine",
        query: "Banana Leaf Rice",
        priority: "must_do",
        preferred_time: "lunch",
        participants_interested: ["p1", "p3"],
        clusters: ["banana_leaf"],
      },
      {
        id: "w2",
        created_by: "p3",
        title: "Indian food",
        type: "cuisine",
        query: "Indian food",
        priority: "would_love",
        preferred_time: "lunch",
        participants_interested: ["p3"],
        clusters: ["banana_leaf"],
      },
      {
        id: "w3",
        created_by: "p1",
        title: "Kinokuniya",
        type: "venue",
        query: "Kinokuniya",
        priority: "nice_to_have",
        preferred_time: "afternoon",
        participants_interested: ["p1"],
        clusters: [],
      },
    ],
    events: [],
    ...extra,
  };
}

describe("room codes", () => {
  it("always generates a unique memorable login code", () => {
    const a = generateRoomCode("KL Food Squad");
    const b = generateRoomCode("KL Food Squad", [a]);
    assert.notEqual(a, b);
    assert.match(a, /^[A-Z0-9-]{6,40}$/);
    assert.equal(normalizeCode(" kl-food-squad-2026 "), "KL-FOOD-SQUAD-2026");
  });
});

describe("avatars", () => {
  it("is deterministic for the same name + room", () => {
    const a = assignAvatar("Venmani", "KL-FOOD-SQUAD-2026");
    const b = assignAvatar("Venmani", "KL-FOOD-SQUAD-2026");
    assert.equal(a.id, b.id);
    assert.ok(a.initials);
  });
});

describe("maps links", () => {
  it("reads coordinates from common Google Maps URL shapes", () => {
    assert.deepEqual(
      parseMapsCoords(
        "https://www.google.com/maps/place/Target/@33.8000241,-118.1239713,15z/data=!4m6!3m5!1s0x0!8m2!3d33.7978736!4d-118.1226002",
      ),
      { lat: 33.7978736, lng: -118.1226002 },
    );
    assert.deepEqual(parseMapsCoords("https://www.google.com/maps/place/Foo/@3.1415,101.6869,17z"), {
      lat: 3.1415,
      lng: 101.6869,
    });
    assert.deepEqual(parseMapsCoords("https://maps.google.com/?q=3.1306,101.6728"), {
      lat: 3.1306,
      lng: 101.6728,
    });
    assert.deepEqual(parseMapsCoords("https://www.google.com/maps/place/Foo/data=!3m1!4b1!4m6!3m5!1s0x0!8m2!3d3.1578!4d101.7123"), {
      lat: 3.1578,
      lng: 101.7123,
    });
    assert.equal(
      extractMapsUrl("try this https://maps.app.goo.gl/abcd please"),
      "https://maps.app.goo.gl/abcd",
    );
    assert.deepEqual(
      scrapeMapsHtml('window.APP_INITIALIZATION_STATE=[[[null,null,3.1491,101.7134]]]'),
      { lat: 3.1491, lng: 101.7134 },
    );
    assert.equal(
      unwrapMapsContinueUrl(
        "https://consent.google.com/ml?continue=https://www.google.com/maps/place/Foo/@3.1415,101.6869,17z",
      ),
      "https://www.google.com/maps/place/Foo/@3.1415,101.6869,17z",
    );
    assert.equal(
      mapsPlaceQuery("https://www.google.com/maps/search/?api=1&query=VCR+Cafe+Bangsar"),
      "VCR Cafe Bangsar",
    );
  });

  it("pins a scheduled stop from a Maps URL even without a catalog match", () => {
    const result = scheduleItinerary(
      baseRoom({
        wishlist: [
          {
            id: "w_map",
            created_by: "p1",
            title: "Custom cafe",
            type: "venue",
            query: "Custom cafe",
            maps_url: "https://www.google.com/maps/place/Foo/@3.1415,101.6869,17z",
            priority: "must_do",
            preferred_time: "morning",
            participants_interested: ["p1"],
          },
        ],
      }),
    );
    const ev = result.events.find((e) => e.wishlist_id === "w_map");
    assert.ok(ev);
    assert.equal(ev.venue.lat, 3.1415);
    assert.equal(ev.venue.lng, 101.6869);
  });
});

describe("intent", () => {
  it("classifies a walking tour request", () => {
    const walk = extractIntent("walking tour from Petaling Street to Zhongshan in the evening", "walk");
    assert.equal(walk.type, "walk");
  });

  it("classifies hipster places separately from generic cuisine", () => {
    const hip = extractIntent("hidden speakeasy with natural wine", "hipster");
    assert.equal(hip.type, "hipster");
    const food = extractIntent("Japanese curry");
    assert.equal(food.type, "cuisine");
  });

  it("detects banana leaf / indian / south indian as a group match", () => {
    const matches = detectGroupMatches(baseRoom().wishlist);
    assert.ok(matches.some((m) => m.cluster === "banana_leaf" && m.participant_ids.length >= 2));
  });
});

describe("availability", () => {
  it("never marks Adila present before she arrives", () => {
    assert.equal(
      participantPresent(adila, "2026-08-30T12:00:00+08:00", "2026-08-30T14:00:00+08:00"),
      false,
    );
    assert.equal(
      participantPresent(adila, "2026-09-01T12:00:00+08:00", "2026-09-01T14:00:00+08:00"),
      true,
    );
  });

  it("computes the full-group overlap as Aug 31–Sep 3", () => {
    const w = fullGroupWindow([venmani, lynn, adila]);
    assert.ok(w);
    assert.equal(w.start.toISOString(), new Date(adila.arrival).toISOString());
    assert.equal(w.end.toISOString(), new Date(adila.departure).toISOString());
  });
});

describe("scheduler", () => {
  it("places banana leaf inside the full-group window", () => {
    const result = scheduleItinerary(baseRoom());
    const leaf = result.events.find((e) => e.wishlist_id === "w1");
    assert.ok(leaf, "banana leaf should be scheduled");
    const start = new Date(leaf.start);
    assert.ok(start >= new Date(adila.arrival), "must wait until Adila arrives");
    assert.ok(new Date(leaf.end) <= new Date(adila.departure), "must finish before Adila leaves");
    assert.ok(leaf.participants.includes("p1") && leaf.participants.includes("p3"));
    assert.equal(detectConflicts({ ...baseRoom(), events: result.events }).length, 0);
  });

  it("parks a niche bookstore in a solo / partial window", () => {
    const result = scheduleItinerary(baseRoom());
    const book = result.events.find((e) => e.wishlist_id === "w3");
    assert.ok(book);
    const start = new Date(book.start);
    const inFull = start >= new Date(adila.arrival) && start < new Date(adila.departure);
    assert.equal(inFull, false, "Kinokuniya should not consume the full-group window");
  });

  it("never moves locked events on re-optimize", () => {
    const locked = {
      id: "e_lock",
      wishlist_id: "w_lock",
      title: "Din Tai Fung",
      start: "2026-09-01T11:30:00.000Z",
      end: "2026-09-01T13:00:00.000Z",
      block: "dinner",
      participants: ["p1", "p2", "p3"],
      locked: true,
      venue: { name: "Din Tai Fung" },
    };
    const room = baseRoom({
      events: [locked],
      wishlist: [
        ...baseRoom().wishlist,
        {
          id: "w_lock",
          created_by: "p2",
          title: "Din Tai Fung",
          type: "venue",
          query: "Din Tai Fung",
          priority: "must_do",
          participants_interested: ["p1", "p2", "p3"],
        },
      ],
    });
    const result = scheduleItinerary(room, { scope: "all" });
    const kept = result.events.find((e) => e.id === "e_lock");
    assert.ok(kept);
    assert.equal(kept.start, locked.start);
    assert.equal(kept.locked, true);
  });

  it("maps a named hipster venue to that place, not the first café in the catalog", () => {
    const result = scheduleItinerary(
      baseRoom({
        wishlist: [
          {
            id: "w_z",
            created_by: "p1",
            title: "Zhongshan Building",
            type: "hipster",
            query: "Zhongshan Building",
            priority: "nice_to_have",
            preferred_time: "afternoon",
            participants_interested: ["p1"],
            hipster_category: "design_market",
          },
        ],
      }),
    );
    const spot = result.events.find((e) => e.wishlist_id === "w_z");
    assert.ok(spot);
    assert.match(spot.venue.name, /Zhongshan/i);
  });

  it("packs nearby Chinatown stops onto the same day", () => {
    const result = scheduleItinerary(
      baseRoom({
        wishlist: [
          {
            id: "w_z",
            created_by: "p1",
            title: "Zhongshan Building",
            type: "hipster",
            query: "Zhongshan Building",
            priority: "would_love",
            preferred_time: "afternoon",
            participants_interested: ["p1"],
            hipster_category: "design_market",
          },
          {
            id: "w_p",
            created_by: "p1",
            title: "PS150",
            type: "hipster",
            query: "PS150",
            priority: "would_love",
            preferred_time: "evening",
            participants_interested: ["p1"],
            hipster_category: "speakeasy",
          },
        ],
      }),
    );
    const z = result.events.find((e) => e.wishlist_id === "w_z");
    const p = result.events.find((e) => e.wishlist_id === "w_p");
    assert.ok(z && p);
    assert.equal(z.start.slice(0, 10), p.start.slice(0, 10));
  });

  it("schedules a walking tour in the evening session", () => {
    const result = scheduleItinerary(
      baseRoom({
        wishlist: [
          {
            id: "w_walk",
            created_by: "p1",
            title: "Chinatown evening wander",
            type: "walk",
            query: "walk from Petaling Street to Zhongshan",
            priority: "must_do",
            preferred_time: "evening",
            participants_interested: ["p1", "p2", "p3"],
            walk_from: { title: "Petaling Street", lat: 3.1438, lng: 101.6969 },
            walk_to: { title: "Zhongshan Building", lat: 3.1372, lng: 101.6955 },
          },
        ],
      }),
    );
    const ev = result.events.find((e) => e.wishlist_id === "w_walk");
    assert.ok(ev);
    assert.equal(ev.block, "evening");
    assert.equal(ev.kind, "walking_tour");
    assert.equal(ev.stops.length, 2);
  });

  it("drops AI proposals that violate arrival windows", () => {
    const proposed = [
      {
        id: "bad",
        title: "Too early",
        start: "2026-08-29T12:00:00+08:00",
        end: "2026-08-29T14:00:00+08:00",
        participants: ["p3"],
        locked: false,
      },
    ];
    const { events, dropped } = enforceHardConstraints(baseRoom(), proposed);
    assert.equal(events.length, 0);
    assert.equal(dropped.length, 1);
  });
});

describe("move and versions", () => {
  it("moves a stop onto an empty block", () => {
    const scheduled = scheduleItinerary(baseRoom());
    const book = scheduled.events.find((e) => e.wishlist_id === "w3");
    assert.ok(book);
    const room = { ...baseRoom(), events: scheduled.events };
    const day = isoDay(book.start, room.timezone);
    const moved = moveEventToBlock(room, book.id, day, "breakfast");
    assert.equal(moved.error, undefined);
    const next = moved.room.events.find((e) => e.id === book.id);
    assert.equal(next.block, "breakfast");
  });

  it("reloads a saved plan", () => {
    const a = scheduleItinerary(baseRoom());
    const saved = pushVersion({ ...baseRoom(), events: a.events }, { label: "First pass" });
    const wiped = { ...saved, events: [] };
    const out = restoreVersion(wiped, saved.versions[0].id);
    assert.equal(out.room.events.length, a.events.length);
  });
});

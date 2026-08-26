import { assignAvatar } from "../shared/avatars.js";
import { generateRoomCode, normalizeCode } from "../shared/codes.js";
import { makeId } from "../shared/ids.js";
import { extractIntent } from "../shared/intent.js";

export const DEMO_CODE = "KL-FOOD-SQUAD-2026";

export function createEmptyRoom({ tripName, timezone, baseLocation, owner, code }) {
  const roomCode = normalizeCode(code) || generateRoomCode(tripName);
  const avatar = assignAvatar(owner.name, roomCode);
  const ownerId = makeId("p");
  return {
    id: makeId("room"),
    code: roomCode,
    trip_name: tripName,
    timezone: timezone || "Asia/Kuala_Lumpur",
    created_at: new Date().toISOString(),
    owner_id: ownerId,
    base_location: {
      name: baseLocation?.name || "",
      address: baseLocation?.address || "",
      maps_url: baseLocation?.maps_url || null,
      lat: baseLocation?.lat ?? null,
      lng: baseLocation?.lng ?? null,
    },
    participants: [
      {
        id: ownerId,
        name: owner.name,
        avatar,
        arrival: owner.arrival,
        departure: owner.departure,
        arrival_location: owner.arrival_location || "",
        departure_location: owner.departure_location || "",
        preferences: owner.preferences || [],
        dietary: owner.dietary || [],
        activities: owner.activities || [],
      },
    ],
    wishlist: [],
    events: [],
    last_optimization: null,
  };
}

export function addParticipant(room, profile) {
  const taken = room.participants.map((p) => p.avatar?.id);
  const avatar = assignAvatar(profile.name, room.code, taken);
  const person = {
    id: makeId("p"),
    name: profile.name,
    avatar,
    arrival: profile.arrival,
    departure: profile.departure,
    arrival_location: profile.arrival_location || "",
    departure_location: profile.departure_location || "",
    preferences: profile.preferences || [],
    dietary: profile.dietary || [],
    activities: profile.activities || [],
  };
  return { room: { ...room, participants: [...room.participants, person] }, participant: person };
}

export function addWish(room, payload, actorId) {
  const intent = extractIntent(payload.query || payload.title, payload.type);
  const wish = {
    id: makeId("w"),
    created_by: actorId,
    title: payload.title || intent.query,
    type: payload.type || intent.type,
    query: payload.query || payload.title,
    intent: intent.intent,
    priority: payload.priority || "would_love",
    preferred_time: payload.preferred_time || "any",
    participants_interested: payload.participants_interested || [actorId],
    required_participants: payload.required_participants || [],
    maps_url: payload.maps_url || null,
    address: payload.address || "",
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    hipster_category: payload.hipster_category || intent.hipster_category || null,
    clusters: intent.clusters || [],
    group_activity: intent.group_activity,
    candidate_venues: [],
    locked: false,
  };
  return { room: { ...room, wishlist: [...room.wishlist, wish] }, wish };
}

export function buildDemoRoom() {
  const room0 = createEmptyRoom({
    tripName: "KL Food Squad",
    timezone: "Asia/Kuala_Lumpur",
    code: DEMO_CODE,
    baseLocation: {
      name: "Petaling Jaya Hotel",
      address: "Petaling Jaya, Selangor, Malaysia",
      maps_url: "https://maps.google.com/?q=3.1073,101.6067",
      lat: 3.1073,
      lng: 101.6067,
    },
    owner: {
      name: "Venmani",
      arrival: "2026-08-29T09:00:00+08:00",
      departure: "2026-09-07T18:00:00+08:00",
      preferences: ["Mala", "Japanese curry"],
    },
  });

  const { room: room1, participant: lynn } = addParticipant(room0, {
    name: "Lynn",
    arrival: "2026-08-30T10:00:00+08:00",
    departure: "2026-09-06T18:00:00+08:00",
    preferences: ["Middle Eastern", "pasta"],
  });
  const { room: room2, participant: adila } = addParticipant(room1, {
    name: "Adila",
    arrival: "2026-08-31T09:00:00+08:00",
    departure: "2026-09-03T18:00:00+08:00",
    preferences: ["Specialty coffee", "Banana leaf"],
  });

  const owner = room2.participants[0];
  const wishes = [
    { actor: owner.id, title: "Mala", type: "cuisine", priority: "must_do", preferred_time: "dinner" },
    { actor: owner.id, title: "Japanese curry", type: "cuisine", priority: "would_love", preferred_time: "lunch" },
    { actor: lynn.id, title: "Middle Eastern", type: "cuisine", priority: "would_love", preferred_time: "dinner" },
    { actor: lynn.id, title: "Pasta", type: "cuisine", priority: "nice_to_have", preferred_time: "lunch" },
    { actor: adila.id, title: "Specialty coffee", type: "cuisine", priority: "would_love", preferred_time: "breakfast" },
    { actor: adila.id, title: "Banana Leaf Rice", type: "cuisine", priority: "must_do", preferred_time: "lunch" },
    {
      actor: owner.id,
      title: "Zhongshan Building",
      type: "hipster",
      priority: "nice_to_have",
      preferred_time: "afternoon",
      hipster_category: "design_market",
    },
  ];

  let room = room2;
  for (const w of wishes) {
    const added = addWish(
      room,
      {
        title: w.title,
        query: w.title,
        type: w.type,
        priority: w.priority,
        preferred_time: w.preferred_time,
        hipster_category: w.hipster_category,
      },
      w.actor,
    );
    room = added.room;
  }
  return room;
}

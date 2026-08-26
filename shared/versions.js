import { makeId } from "./ids.js";

const MAX_VERSIONS = 15;

export function snapshotTrip(room) {
  return {
    events: room.events || [],
    wishlist: room.wishlist || [],
    last_optimization: room.last_optimization || null,
    base_location: room.base_location || null,
  };
}

export function pushVersion(room, { label, saved_by } = {}) {
  const versions = [...(room.versions || [])].filter((v) => v?.id && v?.snapshot);
  const entry = {
    id: makeId("v"),
    label: String(label || "Saved plan").slice(0, 80),
    saved_at: new Date().toISOString(),
    saved_by: saved_by || null,
    event_count: (room.events || []).length,
    snapshot: snapshotTrip(room),
  };
  return { ...room, versions: [entry, ...versions].slice(0, MAX_VERSIONS) };
}

export function restoreVersion(room, versionId) {
  const versions = room.versions || [];
  const hit = versions.find((v) => v.id === versionId);
  if (!hit?.snapshot) return { room, error: "That saved plan is gone." };
  return {
    room: {
      ...room,
      events: hit.snapshot.events || [],
      wishlist: hit.snapshot.wishlist || room.wishlist,
      last_optimization: hit.snapshot.last_optimization || null,
      base_location: hit.snapshot.base_location || room.base_location,
    },
    restored: hit,
  };
}

export function publicVersions(room) {
  return (room.versions || []).map((v) => ({
    id: v.id,
    label: v.label,
    saved_at: v.saved_at,
    saved_by: v.saved_by,
    event_count: v.event_count ?? v.snapshot?.events?.length ?? 0,
  }));
}

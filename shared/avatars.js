import { hashString } from "./ids.js";

const PALETTE = [
  { id: "coral", color: "#E85D4C" },
  { id: "teal", color: "#0F766E" },
  { id: "navy", color: "#1D4E89" },
  { id: "amber", color: "#C2410C" },
  { id: "violet", color: "#6D28D9" },
  { id: "forest", color: "#3F6212" },
  { id: "slate", color: "#334155" },
  { id: "rose", color: "#BE185D" },
  { id: "cyan", color: "#0E7490" },
  { id: "olive", color: "#4D7C0F" },
];

export function initialsFor(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const second = parts.length > 1 ? parts[1][0] : parts[0][1] || "";
  return (first + second).toUpperCase();
}

export function assignAvatar(name, roomCode, takenIds = []) {
  const key = `${String(name || "").trim().toLowerCase()}|${String(roomCode || "").toUpperCase()}`;
  const start = hashString(key) % PALETTE.length;
  for (let i = 0; i < PALETTE.length; i += 1) {
    const swatch = PALETTE[(start + i) % PALETTE.length];
    if (!takenIds.includes(swatch.id)) {
      return {
        id: swatch.id,
        color: swatch.color,
        initials: initialsFor(name),
      };
    }
  }
  const swatch = PALETTE[start];
  return { id: swatch.id, color: swatch.color, initials: initialsFor(name) };
}

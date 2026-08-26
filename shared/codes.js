import { normalizeCode, hashString } from "./ids.js";

const ADJ = [
  "FOOD",
  "CAFE",
  "WILD",
  "NIGHT",
  "SPICE",
  "MAP",
  "CREW",
  "SQUAD",
  "QUEST",
  "PIXEL",
  "LEAF",
  "EMBER",
  "TIDE",
  "NEON",
  "ALLEY",
];
const NOUN = ["TRIP", "RAID", "PARTY", "RUN", "PACK", "QUEST", "CREW", "LOOP"];

function slugWord(name) {
  const cleaned = String(name || "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !["THE", "AND", "FOR", "TRIP"].includes(w));
  const first = (cleaned[0] || "TRIP").slice(0, 10);
  return first;
}

export function generateRoomCode(tripName, existingCodes = []) {
  const year = new Date().getFullYear();
  const slug = slugWord(tripName);
  const seed = hashString(`${tripName}|${Date.now()}|${Math.random()}`);
  for (let i = 0; i < 40; i += 1) {
    const adj = ADJ[(seed + i) % ADJ.length];
    const noun = NOUN[(seed + i * 3) % NOUN.length];
    const extra = i === 0 ? "" : `-${(seed + i).toString(36).slice(-2).toUpperCase()}`;
    const code = normalizeCode(`${slug}-${adj}-${noun}-${year}${extra}`);
    if (!existingCodes.includes(code)) return code;
  }
  return normalizeCode(`${slug}-${(seed % 9999).toString().padStart(4, "0")}-${year}`);
}

export { normalizeCode };

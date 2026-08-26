import { hashString } from "./ids.js";

/** Original creature roster — Pokémon-inspired energy, original names and art. */
export const MASCOTS = [
  {
    id: "voltling",
    name: "Voltling",
    type: "spark",
    emoji: "⚡",
    color: "#F4D35E",
    accent: "#1b1204",
    tag: "spark mouse",
  },
  {
    id: "sproutail",
    name: "Sproutail",
    type: "leaf",
    emoji: "🌱",
    color: "#7DCE82",
    accent: "#102114",
    tag: "seed lizard",
  },
  {
    id: "cinderpaw",
    name: "Cinderpaw",
    type: "ember",
    emoji: "🔥",
    color: "#FF6B4A",
    accent: "#2a0d08",
    tag: "ember kit",
  },
  {
    id: "ripplet",
    name: "Ripplet",
    type: "tide",
    emoji: "💧",
    color: "#6EC6FF",
    accent: "#062033",
    tag: "tide turtle",
  },
  {
    id: "fluffee",
    name: "Fluffee",
    type: "charm",
    emoji: "✨",
    color: "#F4A5C8",
    accent: "#2a1020",
    tag: "song puff",
  },
  {
    id: "napstack",
    name: "Napstack",
    type: "rest",
    emoji: "😴",
    color: "#A8E6CF",
    accent: "#10221c",
    tag: "doze bear",
  },
  {
    id: "hauntling",
    name: "Hauntling",
    type: "shade",
    emoji: "👻",
    color: "#B39DDB",
    accent: "#1a1028",
    tag: "shade wisp",
  },
  {
    id: "puzzleduck",
    name: "Puzzleduck",
    type: "mind",
    emoji: "🦆",
    color: "#FFE066",
    accent: "#2a2208",
    tag: "curious duck",
  },
  {
    id: "whiskerlot",
    name: "Whiskerlot",
    type: "street",
    emoji: "🐱",
    color: "#E8D5B7",
    accent: "#24180e",
    tag: "alley cat",
  },
  {
    id: "eclipup",
    name: "Eclipup",
    type: "shift",
    emoji: "🌙",
    color: "#C9B6E4",
    accent: "#1a1428",
    tag: "dusk fox",
  },
];

export function mascotById(id) {
  return MASCOTS.find((m) => m.id === id) || MASCOTS[0];
}

export function assignMascot(name, roomCode, takenIds = []) {
  const key = `${String(name || "").trim().toLowerCase()}|${String(roomCode || "").toUpperCase()}`;
  const start = hashString(key) % MASCOTS.length;
  for (let i = 0; i < MASCOTS.length; i += 1) {
    const mascot = MASCOTS[(start + i) % MASCOTS.length];
    if (!takenIds.includes(mascot.id)) return mascot;
  }
  return MASCOTS[start];
}

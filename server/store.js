import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeCode } from "../shared/codes.js";
import { buildDemoRoom, DEMO_CODE } from "./roomFactory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const filePath = path.join(dataDir, "rooms.json");

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function load() {
  ensure();
  if (!fs.existsSync(filePath)) return { rooms: {} };
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { rooms: {} };
  }
}

function save(state) {
  ensure();
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function listCodes() {
  return Object.keys(load().rooms);
}

export function getRoom(code) {
  const key = normalizeCode(code);
  const state = load();
  return state.rooms[key] || null;
}

export function upsertRoom(room) {
  const state = load();
  const key = normalizeCode(room.code);
  state.rooms[key] = { ...room, code: key, updated_at: new Date().toISOString() };
  save(state);
  return state.rooms[key];
}

export function seedDemoIfNeeded() {
  if (!getRoom(DEMO_CODE)) upsertRoom(buildDemoRoom());
}

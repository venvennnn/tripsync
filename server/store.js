import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeCode } from "../shared/codes.js";
import { buildDemoRoom, DEMO_CODE } from "./roomFactory.js";
import { supabaseConfig } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.VERCEL ? "/tmp/tripsync-data" : path.join(__dirname, "..", "data");
const filePath = path.join(dataDir, "rooms.json");

function fileEnabled() {
  return !supabaseConfig().enabled;
}

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function loadFile() {
  ensure();
  if (!fs.existsSync(filePath)) return { rooms: {} };
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { rooms: {} };
  }
}

function saveFile(state) {
  ensure();
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function restHeaders() {
  const { key } = supabaseConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export function storageMode() {
  return supabaseConfig().enabled ? "supabase" : "file";
}

export async function listCodes() {
  if (fileEnabled()) return Object.keys(loadFile().rooms);
  const { url } = supabaseConfig();
  const res = await fetch(`${url}/rest/v1/trips?select=code`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`Supabase list failed (${res.status})`);
  const rows = await res.json();
  return rows.map((r) => r.code);
}

export async function getRoom(code) {
  const key = normalizeCode(code);
  if (fileEnabled()) return loadFile().rooms[key] || null;
  const { url } = supabaseConfig();
  const res = await fetch(`${url}/rest/v1/trips?code=eq.${encodeURIComponent(key)}&select=data`, {
    headers: restHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  const rows = await res.json();
  return rows[0]?.data || null;
}

export async function upsertRoom(room) {
  const key = normalizeCode(room.code);
  const saved = { ...room, code: key, updated_at: new Date().toISOString() };
  if (fileEnabled()) {
    const state = loadFile();
    state.rooms[key] = saved;
    saveFile(state);
    return saved;
  }
  const { url } = supabaseConfig();
  const res = await fetch(`${url}/rest/v1/trips?on_conflict=code`, {
    method: "POST",
    headers: {
      ...restHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      code: key,
      data: saved,
      updated_at: saved.updated_at,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase write failed (${res.status}): ${err.slice(0, 180)}`);
  }
  return saved;
}

export async function seedDemoIfNeeded() {
  const existing = await getRoom(DEMO_CODE);
  if (!existing) await upsertRoom(buildDemoRoom());
}

const SESSION_KEY = "tripsync.session";
const GEMINI_KEY = "tripsync.geminiKey";

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadGeminiKey() {
  return localStorage.getItem(GEMINI_KEY) || "";
}

export function saveGeminiKey(key) {
  if (key) localStorage.setItem(GEMINI_KEY, key);
  else localStorage.removeItem(GEMINI_KEY);
}

function headers(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  const key = loadGeminiKey();
  if (key) h["x-gemini-key"] = key;
  return h;
}

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => fetch("/api/health").then(parse),
  config: () => fetch("/api/config").then(parse),
  createRoom: (body) =>
    fetch("/api/rooms", { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(parse),
  getRoom: (code) => fetch(`/api/rooms/${encodeURIComponent(code)}`).then(parse),
  patchRoom: (code, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  join: (code, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/participants`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  patchParticipant: (code, pid, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/participants/${pid}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  addWish: (code, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/wishlist`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  heartWish: (code, wid, participant_id) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/wishlist/${wid}/heart`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ participant_id }),
    }).then(parse),
  deleteWish: (code, wid) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/wishlist/${wid}`, { method: "DELETE", headers: headers() }).then(
      parse,
    ),
  patchWish: (code, wid, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/wishlist/${wid}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  patchEvent: (code, eid, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/events/${eid}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  deleteEvent: (code, eid) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/events/${eid}`, { method: "DELETE", headers: headers() }).then(parse),
  moveEvent: (code, eid, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/events/${eid}/move`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  saveVersion: (code, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/versions`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  restoreVersion: (code, vid, body = {}) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/versions/${vid}/restore`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  optimize: (code, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/optimize`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
  interpret: (code, body) =>
    fetch(`/api/rooms/${encodeURIComponent(code)}/interpret`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(parse),
};

export function formatDay(iso, timeZone = "Asia/Kuala_Lumpur") {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso, timeZone = "Asia/Kuala_Lumpur") {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRange(start, end, timeZone) {
  return `${formatTime(start, timeZone)} – ${formatTime(end, timeZone)}`;
}

export function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function compactDay(day) {
  const [y, m, d] = day.split("-");
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric", timeZone: "UTC" }).format(dt);
}

export const PRIORITY_LABEL = {
  must_do: "Must Do",
  would_love: "Would Love",
  nice_to_have: "Nice to Have",
  optional: "Optional",
};

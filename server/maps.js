import { mapsKey } from "./env.js";
import { estimateTravelMinutes, haversineKm, parseMapsCoords, venuesForWish } from "../shared/places.js";

function key() {
  return mapsKey();
}

export function mapsEnabled() {
  return Boolean(key());
}

function mapsLink(lat, lng, name) {
  if (lat == null || lng == null) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || "")}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export async function geocodeAddress(query) {
  if (!query || !key()) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", key());
  const res = await fetch(url);
  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) return null;
  return {
    name: hit.formatted_address,
    address: hit.formatted_address,
    lat: hit.geometry.location.lat,
    lng: hit.geometry.location.lng,
    maps_url: mapsLink(hit.geometry.location.lat, hit.geometry.location.lng, query),
  };
}

export async function enrichBaseLocation(base) {
  if (!base) return base;
  const parsed = parseMapsCoords(base.maps_url);
  if (parsed) return { ...base, lat: base.lat ?? parsed.lat, lng: base.lng ?? parsed.lng };
  if (base.lat != null && base.lng != null) return base;
  const q = [base.name, base.address, base.maps_url].filter(Boolean).join(", ");
  const geo = await geocodeAddress(q);
  if (!geo) return base;
  return {
    ...base,
    lat: geo.lat,
    lng: geo.lng,
    address: base.address || geo.address,
    maps_url: base.maps_url || geo.maps_url,
  };
}

export async function searchPlaces(query, base) {
  if (!query || !key()) return [];
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", key());
  if (base?.lat != null && base?.lng != null) {
    url.searchParams.set("location", `${base.lat},${base.lng}`);
    url.searchParams.set("radius", "12000");
  }
  const res = await fetch(url);
  const data = await res.json();
  return (data.results || []).slice(0, 5).map((p) => ({
    name: p.name,
    address: p.formatted_address || "",
    lat: p.geometry?.location?.lat ?? null,
    lng: p.geometry?.location?.lng ?? null,
    maps_url: mapsLink(p.geometry?.location?.lat, p.geometry?.location?.lng, p.name),
    rating: p.rating ?? null,
    place_id: p.place_id,
    vibe: p.types?.slice(0, 3).join(" · ") || "",
  }));
}

export async function enrichWishVenues(wish, base) {
  const catalog = venuesForWish(wish, base);
  const near = [base?.name, base?.address].filter(Boolean).join(" ");
  const q =
    wish.type === "hipster"
      ? `${wish.title || wish.query} independent ${wish.hipster_category || "cafe"} ${near}`.trim()
      : `${wish.query || wish.title} ${near}`.trim();
  let live = [];
  try {
    live = await searchPlaces(q, base);
  } catch {
    live = [];
  }
  const merged = [];
  const seen = new Set();
  for (const v of [...live, ...catalog]) {
    const id = (v.place_id || v.id || v.name || "").toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push({
      name: v.name,
      address: v.address || (v.neighborhood ? `${v.neighborhood}, ${v.city}` : ""),
      lat: v.lat ?? null,
      lng: v.lng ?? null,
      maps_url: v.maps_url || mapsLink(v.lat, v.lng, v.name),
      vibe: v.vibe || "",
      rating: v.rating ?? null,
    });
  }
  return merged.slice(0, 5);
}

export async function drivingDistance(from, to) {
  if (!from || !to || from.lat == null || to.lat == null) return null;
  if (!key()) {
    const minutes = estimateTravelMinutes(from, to);
    const km = haversineKm(from, to);
    if (minutes == null) return null;
    return {
      minutes,
      meters: km != null ? Math.round(km * 1000) : null,
      text: km != null ? `${minutes} min · ${km.toFixed(1)} km (estimate)` : `${minutes} min (estimate)`,
      source: "estimate",
    };
  }
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", `${from.lat},${from.lng}`);
  url.searchParams.set("destinations", `${to.lat},${to.lng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("key", key());
  const res = await fetch(url);
  const data = await res.json();
  const el = data.rows?.[0]?.elements?.[0];
  if (!el || el.status !== "OK") {
    const minutes = estimateTravelMinutes(from, to);
    const km = haversineKm(from, to);
    return minutes == null
      ? null
      : {
          minutes,
          meters: km != null ? Math.round(km * 1000) : null,
          text: `${minutes} min (estimate)`,
          source: "estimate",
        };
  }
  const minutes = Math.max(1, Math.round(el.duration.value / 60));
  const meters = el.distance.value;
  return {
    minutes,
    meters,
    text: `${el.duration.text} drive · ${el.distance.text}`,
    source: "google",
  };
}

export async function attachTravelTimes(events, timezoneDay = (iso) => iso?.slice(0, 10)) {
  const next = [...events];
  for (let i = 0; i < next.length; i += 1) {
    const prev = next[i - 1];
    const event = next[i];
    if (!prev || timezoneDay(prev.start) !== timezoneDay(event.start)) {
      next[i] = { ...event, travel_from_previous_min: null, travel_from_previous: null };
      continue;
    }
    const travel = await drivingDistance(prev.venue, event.venue);
    next[i] = {
      ...event,
      travel_from_previous_min: travel?.minutes ?? null,
      travel_from_previous: travel,
    };
  }
  return next;
}

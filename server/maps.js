import { mapsKey } from "./env.js";
import {
  estimateTravelMinutes,
  extractHtmlRedirect,
  extractMapsUrl,
  haversineKm,
  mapsPlaceQuery,
  parseMapsCoords,
  scrapeMapsHtml,
  unwrapMapsContinueUrl,
  venuesForWish,
} from "../shared/places.js";

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

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

const resolveCache = new Map();

export async function resolveMapsUrl(url) {
  if (!url) return null;
  if (resolveCache.has(url)) return resolveCache.get(url);
  const pending = resolveMapsUrlUncached(url);
  resolveCache.set(url, pending);
  return pending;
}

async function resolveMapsUrlUncached(startUrl) {
  const direct = parseMapsCoords(startUrl);
  if (direct) return { ...direct, maps_url: startUrl };
  const seen = new Set();
  let current = startUrl;
  for (let hop = 0; hop < 8; hop += 1) {
    if (!current || seen.has(current)) break;
    seen.add(current);
    const continued = unwrapMapsContinueUrl(current);
    if (continued && !seen.has(continued)) {
      current = continued;
      const parsedContinue = parseMapsCoords(current);
      if (parsedContinue) return { ...parsedContinue, maps_url: current };
      continue;
    }
    try {
      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: BROWSER_HEADERS,
      });
      const loc = res.headers.get("location");
      if (loc) {
        current = new URL(loc, current).href;
        const parsedLoc = parseMapsCoords(current);
        if (parsedLoc) return { ...parsedLoc, maps_url: current };
        continue;
      }
      if (res.status >= 300 && res.status < 400) {
        const followed = await fetch(current, { method: "GET", redirect: "follow", headers: BROWSER_HEADERS });
        const finalUrl = followed.url || current;
        let parsedHop = parseMapsCoords(finalUrl);
        if (parsedHop) return { ...parsedHop, maps_url: finalUrl };
        const htmlHop = (await followed.text()).slice(0, 220000);
        parsedHop = scrapeMapsHtml(htmlHop);
        if (parsedHop) return { ...parsedHop, maps_url: finalUrl };
        const nextHop = extractHtmlRedirect(htmlHop);
        if (nextHop) {
          current = new URL(nextHop, finalUrl).href;
          continue;
        }
        break;
      }
      const finalUrl = res.url || current;
      let parsed = parseMapsCoords(finalUrl);
      if (parsed) return { ...parsed, maps_url: finalUrl };
      const html = (await res.text()).slice(0, 220000);
      parsed = scrapeMapsHtml(html);
      if (parsed) return { ...parsed, maps_url: finalUrl };
      const next = extractHtmlRedirect(html);
      if (next) {
        current = new URL(next, finalUrl).href;
        continue;
      }
    } catch {
      try {
        const res = await fetch(current, { method: "GET", redirect: "follow", headers: BROWSER_HEADERS });
        const finalUrl = res.url || current;
        let parsed = parseMapsCoords(finalUrl);
        if (parsed) return { ...parsed, maps_url: finalUrl };
        parsed = scrapeMapsHtml((await res.text()).slice(0, 220000));
        if (parsed) return { ...parsed, maps_url: finalUrl };
      } catch {
        return null;
      }
    }
    break;
  }
  return null;
}

export async function pinFromWish(wish, base) {
  const url = wish.maps_url || extractMapsUrl(`${wish.title || ""} ${wish.query || ""} ${wish.address || ""}`);
  if (url) {
    const resolved = await resolveMapsUrl(url);
    if (resolved) {
      return {
        name: mapsPlaceQuery(resolved.maps_url) || wish.title || wish.query,
        address: wish.address || "",
        maps_url: url,
        lat: resolved.lat,
        lng: resolved.lng,
      };
    }
  }
  if (wish.lat != null && wish.lng != null) {
    return {
      name: wish.title || wish.query,
      address: wish.address || "",
      maps_url: url || wish.maps_url || null,
      lat: wish.lat,
      lng: wish.lng,
    };
  }
  const label = [mapsPlaceQuery(url), wish.title || wish.query, base?.name, base?.address]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(", ");
  const geo = await geocodeAddress(label);
  if (geo) {
    return {
      name: wish.title || wish.query,
      address: geo.address,
      maps_url: url || geo.maps_url,
      lat: geo.lat,
      lng: geo.lng,
    };
  }
  const places = await searchPlaces(`${wish.query || wish.title || ""} ${base?.address || base?.name || ""}`.trim(), base);
  if (places[0]?.lat != null) {
    return {
      name: places[0].name,
      address: places[0].address,
      maps_url: url || places[0].maps_url,
      lat: places[0].lat,
      lng: places[0].lng,
      vibe: places[0].vibe,
    };
  }
  return null;
}

export async function ensureEventCoords(events, room) {
  const out = [];
  for (const event of events) {
    if (event.venue?.lat != null && event.venue?.lng != null) {
      out.push(event);
      continue;
    }
    const wish = (room.wishlist || []).find((w) => w.id === event.wishlist_id);
    const pin = await pinFromWish(
      {
        title: event.title,
        query: wish?.query || event.title,
        maps_url: event.venue?.maps_url || wish?.maps_url,
        address: event.venue?.address || wish?.address,
        lat: event.venue?.lat ?? wish?.lat,
        lng: event.venue?.lng ?? wish?.lng,
      },
      room.base_location,
    );
    if (!pin) {
      const catalog = wish ? venuesForWish(wish, room.base_location)[0] : null;
      if (catalog?.lat != null && catalog?.lng != null) {
        out.push({
          ...event,
          venue: {
            ...(event.venue || {}),
            name: event.venue?.name || catalog.name,
            address: event.venue?.address || `${catalog.neighborhood}, ${catalog.city}`,
            maps_url: event.venue?.maps_url || wish?.maps_url || catalog.maps_url,
            lat: catalog.lat,
            lng: catalog.lng,
          },
        });
        continue;
      }
      out.push(event);
      continue;
    }
    out.push({
      ...event,
      venue: {
        ...(event.venue || {}),
        name: event.venue?.name || pin.name,
        address: event.venue?.address || pin.address,
        maps_url: event.venue?.maps_url || pin.maps_url,
        lat: pin.lat,
        lng: pin.lng,
      },
    });
  }
  return out;
}

export async function enrichBaseLocation(base) {
  if (!base) return base;
  const fromUrl = base.maps_url ? await resolveMapsUrl(base.maps_url) : null;
  if (fromUrl) return { ...base, lat: base.lat ?? fromUrl.lat, lng: base.lng ?? fromUrl.lng };
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
  const fromLink = await pinFromWish(wish, base);
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
  for (const v of [fromLink, ...live, ...catalog].filter(Boolean)) {
    const id = (v.place_id || v.id || `${v.name}-${v.lat}` || "").toLowerCase();
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

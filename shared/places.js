export const HIPSTER_CATEGORIES = [
  { id: "third_wave", label: "Third-wave coffee", emoji: "☕" },
  { id: "speakeasy", label: "Speakeasy / hidden bar", emoji: "🍸" },
  { id: "vintage", label: "Vintage & thrift", emoji: "🧥" },
  { id: "records", label: "Record shop", emoji: "🎧" },
  { id: "bookstore", label: "Indie bookstore", emoji: "📚" },
  { id: "natural_wine", label: "Natural wine", emoji: "🍷" },
  { id: "design_market", label: "Design / maker market", emoji: "🪵" },
  { id: "gallery_cafe", label: "Gallery café", emoji: "🖼️" },
  { id: "night_market_alt", label: "Offbeat night market", emoji: "🏮" },
  { id: "rooftop", label: "Rooftop hideout", emoji: "🌃" },
];

/** Curated, non-hallucinated venues. Used when no live Places API is configured. */
export const HIPSTER_CATALOG = [
  {
    id: "vcr",
    name: "VCR Café",
    neighborhood: "Bangsar",
    city: "Kuala Lumpur",
    vibe: "All-day brunch, plants, specialty coffee",
    category: "third_wave",
    maps_url: "https://maps.google.com/?q=3.1306,101.6728",
    lat: 3.1306,
    lng: 101.6728,
    tags: ["coffee", "brunch", "hipster"],
  },
  {
    id: "feeka",
    name: "Feeka Coffee Roasters",
    neighborhood: "Damansara Heights",
    city: "Kuala Lumpur",
    vibe: "Roastery courtyard, slow mornings",
    category: "third_wave",
    maps_url: "https://maps.google.com/?q=3.1512,101.6654",
    lat: 3.1512,
    lng: 101.6654,
    tags: ["coffee", "hipster"],
  },
  {
    id: "kenneka",
    name: "Kenneka Coffee",
    neighborhood: "TTDI",
    city: "Kuala Lumpur",
    vibe: "Quiet specialty cups, locals-in-the-know",
    category: "third_wave",
    maps_url: "https://maps.google.com/?q=3.1389,101.6307",
    lat: 3.1389,
    lng: 101.6307,
    tags: ["coffee", "hipster"],
  },
  {
    id: "neverjudge",
    name: "Never Judge Coffee",
    neighborhood: "Cheras",
    city: "Kuala Lumpur",
    vibe: "Tiny third-wave counter, serious espresso",
    category: "third_wave",
    maps_url: "https://maps.google.com/?q=3.1245,101.7231",
    lat: 3.1245,
    lng: 101.7231,
    tags: ["coffee", "hipster"],
  },
  {
    id: "zhongshan",
    name: "Zhongshan Building",
    neighborhood: "Kampung Attap",
    city: "Kuala Lumpur",
    vibe: "Independent shops, design studios, courtyard coffee",
    category: "design_market",
    maps_url: "https://maps.google.com/?q=3.1372,101.6955",
    lat: 3.1372,
    lng: 101.6955,
    tags: ["hipster", "design", "coffee", "browse"],
  },
  {
    id: "apw",
    name: "APW Bangsar",
    neighborhood: "Bangsar",
    city: "Kuala Lumpur",
    vibe: "Warehouse creative compound, indie food",
    category: "design_market",
    maps_url: "https://maps.google.com/?q=3.1284,101.6712",
    lat: 3.1284,
    lng: 101.6712,
    tags: ["hipster", "food", "design"],
  },
  {
    id: "rexkl",
    name: "REXKL",
    neighborhood: "Jalan Sultan",
    city: "Kuala Lumpur",
    vibe: "Restored cinema, bookstores, late bites",
    category: "bookstore",
    maps_url: "https://maps.google.com/?q=3.1466,101.6978",
    lat: 3.1466,
    lng: 101.6978,
    tags: ["hipster", "books", "night"],
  },
  {
    id: "ps150",
    name: "PS150",
    neighborhood: "Petaling Street",
    city: "Kuala Lumpur",
    vibe: "Pre-war shophouse cocktail den",
    category: "speakeasy",
    maps_url: "https://maps.google.com/?q=3.1432,101.6981",
    lat: 3.1432,
    lng: 101.6981,
    tags: ["speakeasy", "night", "hipster"],
  },
  {
    id: "merchants",
    name: "Merchant's Lane",
    neighborhood: "Petaling Street",
    city: "Kuala Lumpur",
    vibe: "Alley café, tiles, slow afternoon light",
    category: "gallery_cafe",
    maps_url: "https://maps.google.com/?q=3.1438,101.6969",
    lat: 3.1438,
    lng: 101.6969,
    tags: ["cafe", "hipster", "photo"],
  },
  {
    id: "junkrecords",
    name: "Junk Records",
    neighborhood: "Petaling Street",
    city: "Kuala Lumpur",
    vibe: "Vinyl stacks, crate-digging",
    category: "records",
    maps_url: "https://maps.google.com/?q=3.1441,101.6972",
    lat: 3.1441,
    lng: 101.6972,
    tags: ["records", "hipster"],
  },
  {
    id: "kinokuniya",
    name: "Kinokuniya KLCC",
    neighborhood: "KLCC",
    city: "Kuala Lumpur",
    vibe: "Huge bookstore, solo-browse heaven",
    category: "bookstore",
    maps_url: "https://maps.google.com/?q=3.1578,101.7123",
    lat: 3.1578,
    lng: 101.7123,
    tags: ["books", "solo"],
  },
  {
    id: "nirwana",
    name: "Sri Nirwana Maju",
    neighborhood: "Bangsar",
    city: "Kuala Lumpur",
    vibe: "Legendary banana leaf rice hall",
    category: "signature_food",
    maps_url: "https://maps.google.com/?q=3.1301,101.6709",
    lat: 3.1301,
    lng: 101.6709,
    tags: ["banana leaf", "indian", "lunch", "dinner"],
  },
  {
    id: "malayang",
    name: "Mala Xiang Guo (Pavilion / Bukit Bintang)",
    neighborhood: "Bukit Bintang",
    city: "Kuala Lumpur",
    vibe: "DIY mala, group spice night",
    category: "signature_food",
    maps_url: "https://maps.google.com/?q=3.1491,101.7134",
    lat: 3.1491,
    lng: 101.7134,
    tags: ["mala", "chinese", "dinner"],
  },
  {
    id: "curry-house",
    name: "Sushi Zanmai / Japanese Curry nearby Bukit Bintang",
    neighborhood: "Bukit Bintang",
    city: "Kuala Lumpur",
    vibe: "Casual Japanese plates, reliable curry katsu",
    category: "signature_food",
    maps_url: "https://maps.google.com/?q=3.1468,101.7102",
    lat: 3.1468,
    lng: 101.7102,
    tags: ["japanese", "curry", "lunch"],
  },
  {
    id: "naf",
    name: "Tarbush Restaurant",
    neighborhood: "Ampang",
    city: "Kuala Lumpur",
    vibe: "Levant grills, mezze, group tables",
    category: "signature_food",
    maps_url: "https://maps.google.com/?q=3.1592,101.7371",
    lat: 3.1592,
    lng: 101.7371,
    tags: ["middle eastern", "lebanese", "dinner"],
  },
  {
    id: "pasta",
    name: "Nerovivo",
    neighborhood: "Changkat",
    city: "Kuala Lumpur",
    vibe: "Italian trattoria energy, pasta night",
    category: "signature_food",
    maps_url: "https://maps.google.com/?q=3.1479,101.7036",
    lat: 3.1479,
    lng: 101.7036,
    tags: ["pasta", "italian", "dinner"],
  },
];

function validCoords(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}

function matchCoords(s, swapped = false) {
  const m = s;
  if (!m) return null;
  const lat = Number(swapped ? m[2] : m[1]);
  const lng = Number(swapped ? m[1] : m[2]);
  return validCoords(lat, lng) ? { lat, lng } : null;
}

function normalizeMapsText(input) {
  return String(input || "")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u002f/gi, "/")
    .replace(/&amp;/g, "&")
    .replace(/%40/g, "@")
    .replace(/%2C/gi, ",");
}

export function parseMapsCoords(input) {
  if (!input) return null;
  const variants = [String(input), normalizeMapsText(input)];
  try {
    variants.push(decodeURIComponent(normalizeMapsText(input)));
  } catch {
    /* keep raw */
  }
  const patterns = [
    { re: /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/ },
    { re: /!8m2!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/ },
    { re: /@(-?\d+\.\d+),(-?\d+\.\d+)/ },
    { re: /[?&](?:q|query|ll|center|sll)=(-?\d+\.\d+),(-?\d+\.\d+)/ },
    { re: /\/(?:search|dir)\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/ },
    { re: /destination=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i },
    { re: /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/ },
    { re: /"location"\s*:\s*\{\s*"lat"\s*:\s*(-?\d+\.\d+)\s*,\s*"lng"\s*:\s*(-?\d+\.\d+)/ },
    { re: /!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/, swapped: true },
  ];
  for (const text of variants) {
    for (const { re, swapped } of patterns) {
      const m = text.match(re);
      const hit = matchCoords(m, swapped);
      if (hit) return hit;
    }
  }
  return null;
}

export function scrapeMapsHtml(html) {
  if (!html) return null;
  return parseMapsCoords(html) || parseMapsCoords(normalizeMapsText(html));
}

export function unwrapMapsContinueUrl(url) {
  try {
    const u = new URL(url);
    for (const key of ["continue", "continueUrl", "url"]) {
      const v = u.searchParams.get(key);
      if (v && /^https?:/i.test(v)) return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function extractHtmlRedirect(html) {
  if (!html) return null;
  const text = normalizeMapsText(html);
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
    /property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]+property=["']og:url["']/i,
    /http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i,
    /window\.location(?:\.replace|\s*=)\s*\(?['"]([^'"]+)['"]/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1] && /^https?:/i.test(m[1])) return m[1];
  }
  return unwrapMapsContinueUrl(text.match(/https?:\/\/consent\.google\.com[^"' <]+/i)?.[0] || "") || null;
}

export function mapsPlaceQuery(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q") || u.searchParams.get("query") || u.searchParams.get("destination");
    if (q && !/^-?\d+\.\d+\s*,/.test(q)) return q.replace(/\+/g, " ").trim();
    const m = u.pathname.match(/\/(?:place|search)\/([^/@]+)/);
    if (m) {
      const name = decodeURIComponent(m[1].replace(/\+/g, " ")).trim();
      if (name && !/^-?\d+\.\d+/.test(name)) return name;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function extractMapsUrl(text) {
  const m = String(text || "").match(
    /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|share\.google|(?:www\.)?(?:google\.com\/maps|maps\.google(?:\.com)?))[^\s<>"']*/i,
  );
  return m ? m[0].replace(/[),.;]+$/, "") : null;
}

export function venuesForWish(wish, baseLocation = null) {
  const title = String(wish.title || "").toLowerCase();
  const q = `${wish.query || ""} ${wish.title || ""} ${wish.intent || ""}`.toLowerCase();
  const cityHint = `${baseLocation?.name || ""} ${baseLocation?.address || ""}`.toLowerCase();
  const inKL = /kuala|lumpur|petaling|selangor|kl\b|bangsar|pj\b/.test(cityHint) || !cityHint.trim();
  const pool = HIPSTER_CATALOG.filter((v) => inKL || v.city !== "Kuala Lumpur");

  const named = pool.filter(
    (v) => (title && v.name.toLowerCase().includes(title)) || q.includes(v.name.toLowerCase()),
  );
  if (named.length) return named.slice(0, 5);

  if (wish.type === "hipster") {
    const byCat = pool.filter((v) => v.category === wish.hipster_category);
    const hip = pool.filter((v) => v.tags.includes("hipster"));
    return (byCat.length ? byCat : hip).slice(0, 5);
  }

  return pool.filter((v) => v.tags.some((t) => q.includes(t))).slice(0, 5);
}

export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export function estimateWalkMinutes(from, to) {
  const km = haversineKm(from, to);
  if (km == null) return null;
  return Math.max(4, Math.round((km / 4.6) * 60));
}

export function estimateTravelMinutes(from, to) {
  const km = haversineKm(from, to);
  if (km == null) return null;
  return Math.max(8, Math.round((km / 22) * 60 + 6));
}

/** Same-session walk (~15–18 min) vs same-neighborhood vs crosstown. */
export const WALK_KM = 1.4;
export const NEIGHBORHOOD_KM = 4.2;

export function proximityBonus(venue, others = []) {
  if (!venue || venue.lat == null || !others.length) return 0;
  let bestKm = Infinity;
  for (const o of others) {
    const km = haversineKm(venue, o);
    if (km == null) continue;
    if (km < bestKm) bestKm = km;
  }
  if (!Number.isFinite(bestKm)) return 0;
  if (bestKm <= WALK_KM) return 34;
  if (bestKm <= NEIGHBORHOOD_KM) return 16;
  if (bestKm >= 14) return -14;
  return 0;
}

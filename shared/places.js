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

export function parseMapsCoords(url) {
  if (!url) return null;
  const at = String(url).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const q = String(url).match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };
  return null;
}

export function venuesForWish(wish, baseLocation = null) {
  const q = `${wish.query || ""} ${wish.title || ""} ${wish.intent || ""}`.toLowerCase();
  const cityHint = `${baseLocation?.name || ""} ${baseLocation?.address || ""}`.toLowerCase();
  const inKL = /kuala|lumpur|petaling|selangor|kl\b|bangsar|pj\b/.test(cityHint) || !cityHint.trim();

  return HIPSTER_CATALOG.filter((v) => {
    if (!inKL && v.city === "Kuala Lumpur") return false;
    if (wish.type === "hipster") {
      return v.tags.includes("hipster") || v.category === wish.hipster_category;
    }
    return v.tags.some((t) => q.includes(t)) || q.includes(v.name.toLowerCase());
  }).slice(0, 5);
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

export function estimateTravelMinutes(from, to) {
  const km = haversineKm(from, to);
  if (km == null) return null;
  return Math.max(8, Math.round((km / 22) * 60 + 6));
}

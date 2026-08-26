const SYNONYMS = [
  {
    id: "banana_leaf",
    labels: ["banana leaf", "nasi daun pisang", "south indian", "indian food", "indian cuisine", "chettinad"],
  },
  { id: "mala", labels: ["mala", "hotpot", "hot pot", "sichuan", "spicy chinese", "xiang guo"] },
  { id: "japanese", labels: ["japanese", "curry", "ramen", "sushi", "katsu", "izakaya"] },
  { id: "coffee", labels: ["coffee", "cafe", "café", "specialty coffee", "third wave", "espresso"] },
  { id: "middle_east", labels: ["middle eastern", "lebanese", "syrian", "palestinian", "arabic", "mezze", "shawarma"] },
  { id: "pasta", labels: ["pasta", "italian", "trattoria", "pizza"] },
  { id: "chinese", labels: ["chinese", "dim sum", "cantonese", "zi char", "wantan"] },
  { id: "hipster", labels: ["hipster", "speakeasy", "vintage", "record", "indie", "hidden", "natural wine", "thrift"] },
];

const HIPSTER_RE =
  /hipster|speakeasy|third[-\s]?wave|vintage|thrift|record shop|vinyl|indie bookstore|natural wine|hidden bar|gallery caf[eé]|maker space|design market/i;

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function clusterIdsForText(text) {
  const t = String(text || "").toLowerCase();
  return SYNONYMS.filter((s) => s.labels.some((l) => t.includes(l))).map((s) => s.id);
}

export function extractIntent(rawText, typeHint = "") {
  const text = String(rawText || "").trim();
  const lower = text.toLowerCase();
  const maps = /(google\.com\/maps|maps\.app\.goo\.gl|maps\.google)/i.test(text);
  const clusters = clusterIdsForText(text);
  const walkRe = /\b(walk(?:ing)? tour|stroll|wander from|walk from)\b/i;

  if (typeHint === "walk" || walkRe.test(text)) {
    return {
      type: "walk",
      query: text,
      intent: "walking session between nearby places",
      preferred_time: /morning/.test(lower) ? "morning" : /afternoon/.test(lower) ? "afternoon" : "evening",
      group_activity: true,
      clusters: [...new Set(["walk", ...clusters])],
    };
  }

  if (typeHint === "hipster" || HIPSTER_RE.test(text)) {
    const cat =
      /speak|cocktail|bar/.test(lower)
        ? "speakeasy"
        : /record|vinyl/.test(lower)
          ? "records"
          : /book/.test(lower)
            ? "bookstore"
            : /wine/.test(lower)
              ? "natural_wine"
              : /vintage|thrift/.test(lower)
                ? "vintage"
                : /coffee|cafe|café/.test(lower)
                  ? "third_wave"
                  : "design_market";
    return {
      type: "hipster",
      query: text,
      intent: "independent / offbeat place with local character",
      hipster_category: cat,
      preferred_radius_km: 10,
      group_activity: false,
      clusters: [...new Set(["hipster", ...clusters])],
    };
  }

  if (typeHint === "venue" || maps || /^[A-Z][\w'&.\s-]{3,}$/.test(text) && /kitchen|cafe|café|restaurant|bar|hotel/i.test(text)) {
    return {
      type: "venue",
      query: text,
      intent: "exact venue request",
      group_activity: true,
      clusters,
    };
  }

  if (typeHint === "cuisine" || clusters.some((c) => c !== "hipster") || /food|eat|dinner|lunch|breakfast|cuisine/i.test(text)) {
    return {
      type: "cuisine",
      query: text,
      intent: clusters[0] ? `find strong examples of ${clusters[0].replaceAll("_", " ")}` : `cuisine: ${text}`,
      preferred_radius_km: 8,
      price_preference: "moderate",
      group_activity: true,
      clusters,
    };
  }

  const atmosphere = [];
  if (/chill|quiet|talk|hang|slow|comfortable/.test(lower)) atmosphere.push("quiet", "comfortable");
  if (/walk|explore|wander/.test(lower)) atmosphere.push("walkable");
  if (/night|late/.test(lower)) atmosphere.push("night");
  if (/photo|pretty|aesthetic/.test(lower)) atmosphere.push("photogenic");

  return {
    type: "natural",
    query: text,
    intent: text,
    category: /coffee|cafe/.test(lower) ? "cafe" : /bar|drink/.test(lower) ? "bar" : "activity",
    atmosphere,
    duration: /hours|chill|talk/.test(lower) ? "long" : "medium",
    group_activity: !/solo|myself|alone/.test(lower),
    clusters,
  };
}

export function detectGroupMatches(wishlist) {
  const byCluster = new Map();
  for (const wish of wishlist) {
    const ids = wish.clusters?.length ? wish.clusters : clusterIdsForText(`${wish.title} ${wish.query}`);
    for (const cid of ids) {
      if (!byCluster.has(cid)) byCluster.set(cid, []);
      byCluster.get(cid).push(wish);
    }
  }

  const matches = [];
  for (const [cluster, wishes] of byCluster) {
    const people = new Set();
    for (const w of wishes) {
      for (const pid of w.participants_interested || [w.created_by]) people.add(pid);
    }
    if (people.size >= 2) {
      matches.push({
        cluster,
        wish_ids: wishes.map((w) => w.id),
        participant_ids: [...people],
        label: cluster.replaceAll("_", " "),
      });
    }
  }
  return matches;
}

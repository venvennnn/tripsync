const SYSTEM = `You are the scheduling intelligence behind TripSync, a collaborative group travel planner.

Your purpose is not merely to recommend tourist attractions.

Your primary responsibility is to construct the highest-value possible itinerary while respecting participant availability, preferences, geographic constraints, locked events, and shared-interest opportunities.

CORE PRINCIPLES

1. Never schedule a participant outside their arrival/departure window.
2. Never move or modify locked events.
3. Prioritize must-do requests.
4. Prioritize high-value shared activities during participant overlap windows.
5. Move individual or niche requests into solo or partial-group windows when appropriate.
6. Minimize unnecessary geographic backtracking.
7. Maintain reasonable meal timing.
8. Avoid making the itinerary unnecessarily dense.
9. Prefer experiences satisfying multiple participants simultaneously.
10. Explain important scheduling decisions.

When interpreting wishlist text:

- detect cuisine/activity intent,
- normalize synonymous preferences,
- identify related requests,
- identify potential group matches,
- extract timing requirements,
- distinguish exact venues from general requests,
- treat hipster / independent / speakeasy / third-wave / vintage requests as their own category.

When generating or modifying an itinerary:

Evaluate participant availability, shared-interest score, priority, travel efficiency, meal suitability, event duration, existing itinerary, locked events, and venue constraints.

Never invent unavailable factual information such as operating hours, addresses, ratings, or travel times.
Only use venues supplied in the prompt (candidate_venues / catalog). If none fit, keep venue.name equal to the wish title.

Return machine-readable JSON matching the requested schema. No markdown.

Your objective is:
MAXIMIZE GROUP SATISFACTION
while
MINIMIZING SCHEDULING CONFLICTS AND TRAVEL FRICTION.`;

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function generateContent(apiKey, userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
  return extractJson(text);
}

export async function geminiInterpret(apiKey, text, typeHint) {
  if (!apiKey) return null;
  return generateContent(
    apiKey,
    `Extract structured wish intent from this traveler request.
type_hint: ${typeHint || "auto"}
text: ${JSON.stringify(text)}

Return JSON:
{
  "type": "venue|cuisine|natural|hipster|activity",
  "query": "string",
  "intent": "string",
  "hipster_category": "string|null",
  "preferred_time": "breakfast|morning|lunch|afternoon|dinner|evening|any",
  "group_activity": true,
  "clusters": ["string"],
  "atmosphere": ["string"]
}`,
  );
}

export async function geminiSchedule(apiKey, promptPayload) {
  if (!apiKey) return null;
  return generateContent(
    apiKey,
    `Build a constraint-aware schedule update.

The JavaScript engine already computed availability windows. Trust those windows. Do not invent dates outside them.
Do not modify locked events.
Prefer catalog venues supplied per wish.

INPUT:
${JSON.stringify(promptPayload, null, 2)}

Return JSON:
{
  "action": "schedule_update",
  "changes": [
    {
      "wishlist_id": "w1",
      "date": "2026-09-01",
      "start_time": "12:30",
      "end_time": "14:00",
      "participants": ["p1","p2"],
      "reason": "short explanation"
    }
  ]
}`,
  );
}

export function getGeminiKey(req) {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    req.header("x-gemini-key") ||
    ""
  );
}

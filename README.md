# TripSync

**Everyone wants something. TripSync finds the moment.**

Collaborative trip planner for small groups with mixed arrivals, cravings, and a shared itinerary that respects who is actually around.

## Room codes (login)

Every trip **always** has a login code (`KL-FOOD-SQUAD-2026` style). The itinerary, wishlist, and traveler list stay hidden until someone enters that code. The URL alone is not enough.

Sample trip (seeded on first server start): `KL-FOOD-SQUAD-2026`

## Run

```bash
npm install
npm test
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

Production:

```bash
npm run build
npm start
```

Optional: set `GEMINI_API_KEY` (or paste a key in the room footer) so Gemini can interpret vague wishes and propose schedules. JavaScript still enforces arrival windows and locked events.

## Stack

Browser UI (React + Tailwind) → trip state (JSON file + local session) → deterministic engine (overlap, locks, conflicts) → optional Gemini reasoning → curated venue catalog (including hipster / independent spots).

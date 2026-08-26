# TripSync

Collaborative trip planner for small groups with mixed arrivals. Every trip has a login code. Data stays hidden until that code is entered.

## Run locally

```bash
npm install
npm test
npm run dev
```

## Persist trips (Supabase)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Set:

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Without these, trips store in a local `data/rooms.json` file (fine for development, not for Vercel).

## Google Maps distances

Enable **Geocoding API**, **Places API**, **Distance Matrix API**, and **Maps JavaScript API**. Set:

```
GOOGLE_MAPS_API_KEY=...
```

Re-Optimize then uses live place search and driving time between stops.

## Deploy (Vercel)

Connect the GitHub repo to Vercel, or:

```bash
npx vercel --prod
```

Add the same env vars in the Vercel project settings. Alternative: Render using `render.yaml`.

Sample room (seeded): `KL-FOOD-SQUAD-2026`

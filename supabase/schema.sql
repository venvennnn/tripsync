-- TripSync persistence. Run this in the Supabase SQL editor.

create table if not exists public.trips (
  code text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

-- Access goes through the TripSync API with the service role key.
-- Do not expose this table to the browser.

comment on table public.trips is 'One row per trip room; code is the login key.';

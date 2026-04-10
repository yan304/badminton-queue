# Badminton Queueing System

This app manages a badminton game floor with:

- Local persistence through `localStorage`
- Skill-based suggested doubles pairings
- Live score tracking per court
- Match history with final results
- Optional Supabase snapshot sync

## Run locally

```bash
npm install
npm run dev
```

## Supabase setup

1. Copy `.env.example` to `.env`
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Create this table in Supabase:

```sql
create table if not exists public.queueing_snapshots (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
```

4. Add an RLS policy that allows the app to `select` and `upsert` this row for your chosen auth model, or disable RLS for quick local testing.

By default the app syncs one row with ID `badminton-main`. You can change that with `VITE_SUPABASE_SNAPSHOT_ID`.

## Data model

The board stores one snapshot containing:

- `players`
- `queue`
- `courts`
- `matchHistory`
- `updatedAt`

If Supabase is not configured, the app still works fully with local persistence only.

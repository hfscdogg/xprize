# XPrize

Internal bounty board for Livewire. Henry lists OpenAI projects with cash prizes; employees submit ideas, upvote what to work on next, log contributions, and democratically vote on winners. Prizes paid out at quarterly all-hands.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth via magic link)
- Vercel for hosting

## Local setup

1. Copy env vars:
   ```
   cp .env.example .env.local
   ```
   Fill in the three Supabase keys.

2. Install:
   ```
   npm install
   ```

3. Apply migrations to your Supabase project (via dashboard SQL editor or `supabase db push`):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`

4. In Supabase Auth settings:
   - Enable Email provider
   - Set Site URL to your prod URL; add `http://localhost:3000` to redirect URLs

5. Run:
   ```
   npm run dev
   ```

6. Sign in as `henry@getlivewire.com` — the signup trigger seeds admin.

## Permissions model

- `@getlivewire.com` emails only (enforced by `on_auth_user_created` trigger).
- `is_admin` flag on `profiles`; Henry is seeded admin.
- Row-level security on every table. Admin bypasses via `public.is_admin()`.

## Project lifecycle

`open` (prize = $0 means idea-stage) → `in_progress` → `judging` → `awarded` → `paid`.

Anyone can create a project (defaults to prize $0). Admin sets the prize and moves status. When `judging`, employees vote on a winning contributor. Admin picks the winner (or follows the tally) and marks paid at the all-hands meeting.

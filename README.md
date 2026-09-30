# Track Made Easy

A demo-first Marcom budget tracker built with Next.js and Supabase. The homepage shows monthly approved budgets, committed expenses, actual expenses, and remaining balances. Expenses start committed; a human approval moves them to actual. Editing an approved expense sends it back for review.

## Run locally

1. Install dependencies with `pnpm install` (Node.js 22.18+).
2. Sign into the account that owns the existing Vercel project, then run `vercel link --project track-made-easy` and `vercel env pull .env.local`.
3. Run `pnpm verify:database` to check the provisioned tables. If the schema is missing, apply `supabase/migrations/0001_init.sql` through the project's Supabase SQL editor or authenticated migration tooling. Do not recreate tables that already exist.
4. Run `pnpm dev` and open localhost:3000.

The application requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Keys are never committed. All writes use named server actions against the existing categories, budgets, and expenses tables. This release follows the docs' shared, public demo permission model; authentication and team roles are a later sprint.

## Checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`: PRD arithmetic, cents precision, unbudgeted spend, empty totals.
- `pnpm build`
- `pnpm test:workflow`: production browser workflow against a disposable local PostgREST simulator. Run after building. Install a Playwright browser (`pnpm exec playwright install chromium`), or set `CHROME_PATH` to an installed Chrome executable. This test does **not** verify live Supabase permissions or deployment.
- `pnpm verify:database`: read-only check of the configured Supabase schema.

For final acceptance, repeat `docs/TEST_PLAN.md` against the deployed project with a fresh category or isolated month; seed expenses otherwise contribute to the totals. Confirm the values survive a page reload and verify individual actual expense details.

## Deployment

Deploy only by committing and pushing `main`; Vercel deploys from GitHub. Do not use `vercel deploy`. Set the repo's Git author as specified in `AGENTS.md`.

## Data behavior

Remaining = approved − committed − actual. Calculations use integer cents. Dashboard queries paginate beyond Supabase's default row limit. Expenses in categories without a budget still count. Deleting a budget preserves expenses; deleting a category is blocked while it has budgets or expenses. Month filtering uses the stored first-of-month date; the initial month follows Asia/Kuala_Lumpur.

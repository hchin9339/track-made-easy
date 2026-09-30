# Implementation status

V1 Sprints 1–3 are implemented locally. Live acceptance is still blocked by account access; this is not a claim that the app has deployed or that Supabase writes have been verified.

## Implemented

- Categories: create, rename, delete (blocked while in use).
- Monthly budgets: create/upsert, edit, delete while keeping expenses.
- Expenses: create committed, edit, approve to actual, delete with confirmation, vendor/date/notes detail.
- Dashboard: per-category and total approved/committed/actual/remaining, monthly filtering, unbudgeted spend, cents-based arithmetic, paginated reads.
- Loading/empty/error/success states; failed writes retain input; mobile navigation and stacked tables.
- Shared demo mode without a login wall, as the PRD requests. Auth, roles, and AI remain later work.

## Verification

Passed production build with type and lint validation enabled, standalone TypeScript and ESLint checks, and four calculation tests. A Playwright production-browser test using a disposable PostgREST simulator passed the PRD's $10,000 / $3,200 / $2,000 scenario, details, month isolation, mobile navigation, CRUD, edit/reapproval, delete confirmation, in-use category protection, and failed-write retry. Desktop/mobile screenshots were inspected. No simulator is used by application code.

## Blocked live checks

`vercel link` had no authenticated session. Its device login was not completed. `vercel env pull .env.local` returned "No existing credentials found". Therefore the provisioned Supabase schema, migration state, seed rows, permissions, and live writes are unverified. The existing migration was preserved unchanged.

Every sprint was committed locally as hchin9339 <334895941+hchin9339@users.noreply.github.com>. Pushes failed because no usable GitHub credentials were available. Vercel deployment has not been triggered by these commits.

## Resume

1. Authenticate Vercel and GitHub for hchin9339 on this machine.
2. Link the existing track-made-easy project and pull `.env.local`.
3. Run `pnpm verify:database`; apply the committed migration only if the schema is absent.
4. Exercise the browser success scenario on the real database using an isolated test month/category and remove the test records afterward.
5. Push main, inspect the Git-triggered Vercel deployment, and repeat acceptance against its real URL.

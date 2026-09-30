# Implementation status

V1 Sprints 1–3 are implemented and pushed to `main`. The existing Vercel project is linked to the GitHub repository and the provisioned Supabase database has passed the PRD acceptance scenario.

## Implemented

- Categories: create, rename, delete (blocked while in use).
- Monthly budgets: create/upsert, edit, delete while keeping expenses.
- Expenses: create committed, edit, approve to actual, delete with confirmation, vendor/date/notes detail.
- Dashboard: per-category and total approved/committed/actual/remaining, monthly filtering, unbudgeted spend, cents-based arithmetic, paginated reads.
- Loading/empty/error/success states; failed writes retain input; mobile navigation and stacked tables.
- Shared demo mode without a login wall, as the PRD requests. Auth, roles, and AI remain later work.

## Verification

Passed production build with type and lint validation enabled, standalone TypeScript and ESLint checks, and four calculation tests. A Playwright production-browser test using a disposable PostgREST simulator passed the PRD's $10,000 / $3,200 / $2,000 scenario, details, month isolation, mobile navigation, CRUD, edit/reapproval, delete confirmation, in-use category protection, and failed-write retry. Desktop/mobile screenshots were inspected. No simulator is used by application code.

## Live verification

`vercel env pull .env.local` retrieved the existing public Supabase configuration. The schema check found 5 categories, 5 budgets, and 6 expenses with all expected columns, so no migration was reapplied.

A production-browser acceptance test created uniquely named records in the real Supabase tables and verified the complete workflow: create a category, set a $10,000 budget, log and approve a $3,200 expense, inspect its vendor/date/notes, then add a $2,000 committed expense and observe $4,800 remaining. The test removed only its uniquely named records and the table counts returned to 5/5/6.

Every sprint was committed and pushed as hchin9339 <334895941+hchin9339@users.noreply.github.com>. Vercel and GitHub are connected so `main` pushes create production deployments.

The existing migration remains unchanged. Auth, per-user RLS, AI categorisation, alerts, and exports remain the later sprints defined in `docs/TASKS.md`.

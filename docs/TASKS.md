# Track Made Easy — Task Plan

## Sprint 1 — Database + Core Expense Engine
**Goal:** DB schema, seed data, expense CRUD, budget CRUD, category CRUD — all working, no login wall.
- [ ] Create migration SQL (categories, budgets, expenses + RLS permissive + seed data)
- [ ] `lib/data/` layer: queries for all three tables (list, insert, update, delete)
- [ ] `lib/actions/` server actions: createExpense, approveExpense, upsertBudget, CRUD categories
- [ ] Expenses page: list + add form + approve button + delete
- [ ] Budgets page: set approved_amount per category per month
- [ ] Categories page: list + add
- [ ] Sidebar nav (Dashboard · Budgets · Expenses · Categories)

**Done:** User can create a budget, log a committed expense, approve it to actual, and delete — all persisted to DB.

## Sprint 2 — Dashboard + Month Filtering (v1 Functional) ✅
**Goal:** Budget vs committed vs actual dashboard; the success scenario works end-to-end.
- [ ] Dashboard page: per-category table — approved / committed / actual / remaining
- [ ] Month selector (default current month)
- [ ] Totals row (sum across categories)
- [ ] Remaining budget colour coding (green/amber/red)
- [ ] Handle empty month (no budget set → prompt to create)

**Done:** Superior opens dashboard for current month, sees approved budget, committed, actual, remaining per category — numbers match DB. **This is the v1 functional milestone.**

## Sprint 3 — Polish + Edge States
**Goal:** Handle all five states cleanly; UX copy; empty/error.
- [ ] Loading skeletons on all pages
- [ ] Empty states with CTAs (no budget → "Set budget"; no expenses → "Add expense")
- [ ] Error toast on failed writes
- [ ] Responsive mobile (hamburger nav, stacked tables)
- [ ] Confirm dialog on delete
- [ ] Expense detail view (vendor, date, notes)

**Done:** Every page handles loading/empty/error/ready; mobile usable.

## Sprint 4 — Lock It Down (Later)
- [ ] Enable Supabase email auth
- [ ] Replace permissive RLS with `auth.uid() = user_id` policies
- [ ] Superior role: see all team rows; approve/delete permissions
- [ ] Redirect unauthenticated to /login
- [ ] Logout

**Done:** Login required; data isolated per user; superior sees team data.

## Sprint 5 — Intelligence + Export (Later)
- [ ] AI auto-categorise on expense create (ai_category + confidence + review_status)
- [ ] Budget overrun alert (80% / 100% thresholds)
- [ ] Export current month to CSV
- [ ] Month-over-month comparison view

---

## Gantt
```
S1: DB + CRUD + nav        ████████
S2: Dashboard + filtering  ████████  ← v1 functional
S3: Polish + edge states  ████████
S4: Lock-down (auth/RLS)  ████████  (later)
S5: Intelligence + export ████████  (later)
```
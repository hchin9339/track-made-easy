# Track Made Easy — Architecture

## Stack
Next.js (App Router) · Supabase (Postgres + RLS) · Vercel deploy.

## Build Sequence (own terms)
- **Now:** Budget CRUD · Expense CRUD · approval workflow · dashboard
- **Next:** Month-over-month comparison · export to CSV · category management UI
- **Later:** Login + per-user RLS lock-down · AI expense categorisation · spend alerts

## Key User Action Flow (Log & Approve Expense)
1. User opens Expenses page, clicks "Add Expense"
2. Fills: category (dropdown), vendor, amount, date, description
3. Saved as status = `committed` in DB
4. Superior sees it under "Pending Approval"
5. Superior clicks "Approve" → status becomes `actual` (server-side update)
6. Dashboard recalculates: committed total, actual total, remaining budget

## Nav Shell
Left sidebar on desktop (Dashboard · Budgets · Expenses · Categories); collapses to hamburger on mobile. Current section highlighted.

## Layer Plan
1. **Data layer** (`lib/data/`) — all DB reads/writes: budgets, expenses, categories
2. **App logic** (`lib/actions/`) — server actions: create expense, approve expense, budget upsert
3. **UI** (`app/` + `components/`) — pages and presentational components
4. **Intelligence** (`lib/ai/`) — later: auto-categorise, spend anomaly flagging

## Why Core Runs Without AI
Every core action (CRUD + approval + dashboard math) is pure DB + server logic. AI features are additive — disabling `lib/ai/` leaves a fully working tracker.

## Repo Structure
```
app/
  dashboard/page.tsx
  expenses/page.tsx
  budgets/page.tsx
  categories/page.tsx
components/
  ExpenseForm.tsx
  BudgetTable.tsx
  Sidebar.tsx
lib/
  data/expenses.ts, budgets.ts, categories.ts
  actions/expenses.ts, budgets.ts
  ai/  (later)
  supabase/client.ts
  types.ts
tests/ (beside code)
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|--------------|------|------------|
| **categories** | Manage spend categories | categories table | 1 |
| **budgets** | Monthly budget per category | budgets table | 2 |
| **expenses** | Log, approve, track expenses | expenses table | 3 |
| **dashboard** | Aggregate budget vs spend view | read-only queries | 4 |
| **auth** (later) | Login + RLS lock-down | auth + policies | 5 |
| **intelligence** (later) | Auto-categorise, alerts | ai fields on expenses | 6 |
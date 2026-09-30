# Track Made Easy — Security

## Secret Handling
- Supabase service key only in server actions / route handlers — never shipped to client
- Client uses anon key + RLS only
- `.env.local` for local; Vercel env vars for prod

## Permission Model
- **v1 (demo):** Open RLS — permissive policies, no login. Demo data visible to all. Safe for preview screenshots.
- **Lock-down sprint:**
  - Enable auth (email/password)
  - Replace permissive policies with `auth.uid() = user_id`
  - Superior role: sees all rows tagged to the team (broaden via a `role` check)
  - Expenses: only creator or superior can edit; only superior can approve or delete
  - Budgets: only superior can edit approved_amount

## Approved-Tools Rule
- Only named server actions operate on data — no raw SQL from client
- No generic `run_anything` tool exposed
- Future agent tools must be named, logged, and permission-scoped

## Audit Principle
- Every status change (`committed` → `actual`) and every delete must be logged with who, when, before/after (once audit_logs table exists — later sprint)
- v1: rely on `created_at` + status field; add full audit at lock-down
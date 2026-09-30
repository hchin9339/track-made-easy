# Track Made Easy — PRD

## Problem
Marcom department tracks monthly budget vs expenses in Excel manually — slow, error-prone, no live status of committed vs actual spend.

## Target User
- Marcom team member (the builder) — logs and manages expenses
- Marcom superior — reviews/approves and monitors budget health

## Core Objects
- **Budget** — monthly approved amount per category
- **Expense** — a line item: committed (pending approval) → approved → actual (spent); amount, vendor, date, category, status, notes
- **Category** — e.g. Events, Digital Ads, Print, PR, Collateral

## MVP (v1) — Checklist
- [ ] Create/edit/delete budget per category per month
- [ ] Log an expense (committed) with vendor, amount, category, date
- [ ] Approve committed expense → mark actual
- [ ] Dashboard: budget vs committed vs actual per category, monthly
- [ ] Filter by month; see remaining budget
- [ ] Seed demo data so app renders without login

## Non-Goals (v1)
- No account/finance team access — Marcom only
- No multi-department support
- No receipts/OCR upload
- No login/auth wall (demo-first; lock-down is a later sprint)
- No notifications/email
- No AI categorisation (later)

## Success Criteria
Superior opens the app for the current month, sees a dashboard showing each category's approved budget, committed expenses, and actual expenses side by side; total actual spend matches the sum of individual actual expenses, and remaining budget is correct. One click on an approved line item reveals vendor, date, and notes. No Excel needed.
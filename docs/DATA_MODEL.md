# Track Made Easy — Data Model

## categories
| Field | Type | Notes |
|------|------|------|
| id | uuid | PK |
| name | text | e.g. "Digital Ads" |
| user_id | uuid | nullable (lock-down later) |
| created_at | timestamptz | default now() |

## budgets
| Field | Type | Notes |
|------|------|------|
| id | uuid | PK |
| category_id | uuid | FK → categories |
| month | date | first of month |
| approved_amount | numeric(12,2) | approved budget |
| user_id | uuid | nullable |
| created_at | timestamptz | default now() |

Constraint: unique (category_id, month).

## expenses
| Field | Type | Notes |
|------|------|------|
| id | uuid | PK |
| category_id | uuid | FK → categories |
| budget_id | uuid | FK → budgets (nullable) |
| vendor | text | who you're paying |
| description | text | line detail |
| amount | numeric(12,2) | expense value |
| expense_date | date | when incurred |
| month | date | first of month (for grouping) |
| status | text | `committed` \| `actual` |
| notes | text | nullable |
| user_id | uuid | nullable |
| created_at | timestamptz | default now() |

**AI fields (later):** `ai_category text` + `ai_source text` + `ai_confidence numeric` + `ai_review_status text default 'unreviewed'` — for auto-categorisation.

## Relationships
- budgets.category_id → categories.id
- expenses.category_id → categories.id
- expenses.budget_id → budgets.id (optional link)

## RLS Notes
- v1 (demo): permissive read/write for all — app renders without login
- Lock-down: `auth.uid() = user_id` on all tables; superior role sees all team rows

## Computed (not stored)
- `committed_total` = SUM(expenses.amount) WHERE status = 'committed'
- `actual_total` = SUM(expenses.amount) WHERE status = 'actual'
- `remaining` = approved_amount − actual_total − committed_total
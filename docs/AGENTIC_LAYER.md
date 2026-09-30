# Track Made Easy — Agentic Layer

## Draftable Actions (low risk — auto, later)
- Suggest category for a new expense → writes `ai_category` (review_status = 'unreviewed')
- Tag expense with likely month if date missing
- Draft a budget-overspend summary comment

## Executable-After-Approval Actions (medium risk — later)
- Move expense from `committed` to `actual` (requires superior approval click)
- Recategorise an expense (superior confirms AI suggestion)

## Human-Only Actions (critical — always)
- Delete an expense (superior only)
- Edit approved_amount on a budget (superior only)
- Delete a category

## Named Tools (v1 — manual, no agent yet)
- `approve_expense(expense_id)` — server action, sets status = 'actual'
- `create_expense(data)` — server action
- `upsert_budget(category_id, month, amount)` — server action

## Audit Log Fields (later)
| Field | Type |
|------|------|
| id | uuid |
| action | text |
| entity_type | text |
| entity_id | uuid |
| actor_id | uuid |
| before | jsonb |
| after | jsonb |
| created_at | timestamptz |

## v1 vs Later
- **v1:** All actions are manual button clicks; no agent. Approval is a human click.
- **Later:** AI drafts suggestions; approval workflow stays human-gated for `actual` and deletes.
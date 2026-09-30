# Track Made Easy — Test Plan

## v1 Success Scenario (manual)
1. Open app → Dashboard renders with seeded demo data (no login)
2. Go to Budgets → set "Digital Ads" = $10,000 for current month
3. Go to Expenses → click "Add Expense"
4. Fill: category = Digital Ads, vendor = Meta, amount = 3200, date = today, description = "Nov campaign"
5. Save → appears in list as status = `committed`
6. Click "Approve" → status changes to `actual`
7. Go to Dashboard → Digital Ads row shows: approved 10000, committed 0, actual 3200, remaining 6800
8. Verify: remaining = approved − actual (3200 = 6800 ✓)
9. Add another committed expense of 2000 → remaining shows 4800 (committed 2000 + actual 3200)

## Empty States
- **No budget set for month:** Budgets page shows empty state with "Set Budget" button
- **No expenses for month:** Expenses page shows "No expenses yet — add one"
- **Dashboard with no data:** Shows prompt to create first budget

## Error Cases
- **Submit expense with missing category:** form validation blocks, shows error message
- **Delete expense:** confirm dialog appears; on confirm, row removed from list and DB
- **Network/server error on save:** toast "Could not save — try again"; form retains input
- **Approve already-actual expense:** button disabled / shows "Approved"

## Permission (post lock-down)
- Non-logged-in → redirect to /login
- Team member cannot edit approved_amount on budget
- Only superior can approve (committed → actual) and delete expenses
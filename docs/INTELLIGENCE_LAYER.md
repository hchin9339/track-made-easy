# Track Made Easy — Intelligence Layer

## Messy Inputs (later)
- Free-text vendor name or description pasted from an invoice/email
- Amount entered without category

## Auto-Structure Schema (JSON)
```json
{
  "input": "Paid Meta $3,200 for Nov campaign",
  "suggested_category": "Digital Ads",
  "suggested_vendor": "Meta",
  "parsed_amount": 3200.00,
  "confidence": 0.92,
  "source": "expense-parser-v1"
}
```

## Events to Track (later)
- expense.created → trigger AI categorisation
- expense.approved → update actual total
- budget.threshold_crossed → flag (80%, 100%)

## Scoring Rules (rule-based, later)
- Category match: vendor keyword → category (e.g. "Meta"/"Google" → Digital Ads) → confidence 0.90+
- Fuzzy vendor match against history → confidence 0.75
- No match → leave blank, confidence 0, review_status = 'needs_review'

## What Gets Ranked (later)
- Categories closest to budget overrun flagged first on dashboard
- Expenses lacking category sorted to top for review

## v1 vs Later
- **v1:** No AI. Manual category selection. Pure CRUD + approval + dashboard.
- **Later:** Auto-categorise on create; overrun alerts; anomaly detection on unusual amounts.
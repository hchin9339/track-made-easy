export type Category = { id: string; name: string };
export type Budget = { id: string; category_id: string; month: string; approved_amount: number };
export type Expense = { id: string; category_id: string; budget_id: string | null; vendor: string; description: string; amount: number; expense_date: string; month: string; status: 'committed' | 'actual'; notes: string };
export type Snapshot = { categories: Category[]; budgets: Budget[]; expenses: Expense[] };

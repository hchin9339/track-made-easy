import type { Snapshot } from "./types";
export function summarize(data: Snapshot) {
  const rows = data.categories.map((category) => {
    const budget = data.budgets.find((b) => b.category_id === category.id);
    const expenses = data.expenses.filter((e) => e.category_id === category.id);
    const cents = (value: number) => Math.round(Number(value) * 100);
    const approved = cents(budget?.approved_amount ?? 0);
    const committed = expenses
      .filter((e) => e.status === "committed")
      .reduce((s, e) => s + cents(e.amount), 0);
    const actual = expenses
      .filter((e) => e.status === "actual")
      .reduce((s, e) => s + cents(e.amount), 0);
    return {
      ...category,
      hasBudget: !!budget,
      approved: approved / 100,
      committed: committed / 100,
      actual: actual / 100,
      remaining: (approved - committed - actual) / 100,
      usage: approved
        ? Math.round(((committed + actual) / approved) * 100)
        : committed + actual > 0
          ? 100
          : 0,
    };
  });
  const sum = (key: "approved" | "committed" | "actual" | "remaining") =>
    rows.reduce((s, r) => s + Math.round(r[key] * 100), 0) / 100;
  return {
    rows,
    totals: {
      approved: sum("approved"),
      committed: sum("committed"),
      actual: sum("actual"),
      remaining: sum("remaining"),
    },
  };
}

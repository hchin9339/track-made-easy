import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Snapshot } from "@/lib/types";

export function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "Database configuration is missing. Connect the provisioned Supabase environment.",
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function snapshot(month: string): Promise<Snapshot> {
  const db = database();
  // Supabase caps a response at 1,000 rows by default. Fetch every page so totals
  // still reconcile as the ledger grows, using stable order across pages.
  async function all(table: "categories" | "budgets" | "expenses") {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      let query = db.from(table).select("*").order("id");
      if (table !== "categories") query = query.eq("month", month);
      const { data, error } = await query.range(offset, offset + 499);
      if (error)
        throw new Error("Could not load your budget data. Please try again.");
      rows.push(...data);
      if (data.length < 500) break;
    }
    return rows;
  }
  const [categories, budgets, expenses] = await Promise.all([
    all("categories"),
    all("budgets"),
    all("expenses"),
  ]);
  categories.sort((a, b) => a.name.localeCompare(b.name));
  expenses.sort(
    (a, b) =>
      b.expense_date.localeCompare(a.expense_date) ||
      b.created_at.localeCompare(a.created_at),
  );
  return { categories, budgets, expenses } as Snapshot;
}

import { createClient } from "@supabase/supabase-js";
try {
  process.loadEnvFile(".env.local");
} catch {}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key)
  throw new Error(
    "Pull the provisioned Vercel environment first: vercel env pull .env.local",
  );
const db = createClient(url, key, { auth: { persistSession: false } });
for (const [table, columns] of Object.entries({
  categories: "id,name,user_id,created_at",
  budgets: "id,category_id,month,approved_amount",
  expenses:
    "id,category_id,budget_id,vendor,description,amount,expense_date,month,status,notes",
})) {
  const { error, count } = await db
    .from(table)
    .select(columns, { count: "exact", head: true });
  if (error) {
    console.error(
      `${table}: schema/read check failed (${error.code}). Check migrations and RLS.`,
    );
    process.exitCode = 1;
  } else
    console.log(`${table}: readable, expected columns present, ${count} rows`);
}

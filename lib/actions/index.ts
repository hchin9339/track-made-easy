"use server";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/data";

export type Result = { ok: boolean; message: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(form: FormData, key: string, max = 500) {
  return String(form.get(key) ?? "")
    .trim()
    .slice(0, max);
}
function id(form: FormData, key = "id") {
  const value = text(form, key);
  if (!uuid.test(value)) throw new Error("Please select a valid record.");
  return value;
}
function date(form: FormData, key: string) {
  const value = text(form, key);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new Error("Enter a valid date.");
  return value;
}
function amount(form: FormData, key: string, allowZero = false) {
  const value = text(form, key);
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter an amount with up to two decimal places.");
  const n = Number(value);
  if (n > 9999999999.99 || (allowZero ? n < 0 : n <= 0))
    throw new Error("Enter an amount within the allowed range.");
  return n;
}
async function run(operation: () => Promise<void>): Promise<Result> {
  try {
    await operation();
    revalidatePath("/", "layout");
    return { ok: true, message: "Saved successfully." };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Could not save — try again.",
    };
  }
}
function check(error: { message: string } | null) {
  if (error)
    throw new Error(
      "Could not save — try again. Check that the record still exists and is not in use.",
    );
}

export async function saveExpense(form: FormData): Promise<Result> {
  return run(async () => {
    const db = database();
    const category_id = id(form, "category_id");
    const expense_date = date(form, "expense_date");
    const month = expense_date.slice(0, 7) + "-01";
    const vendor = text(form, "vendor", 120);
    if (!vendor) throw new Error("Vendor is required.");
    const budget = await db
      .from("budgets")
      .select("id")
      .eq("category_id", category_id)
      .eq("month", month)
      .maybeSingle();
    check(budget.error);
    const values = {
      category_id,
      expense_date,
      month,
      vendor,
      amount: amount(form, "amount"),
      description: text(form, "description"),
      notes: text(form, "notes", 2000),
      budget_id: budget.data?.id ?? null,
    };
    if (form.get("id")) {
      // Changing approved values requires a fresh human approval.
      const result = await db
        .from("expenses")
        .update({ ...values, status: "committed" })
        .eq("id", id(form))
        .select("id")
        .single();
      check(result.error);
    } else {
      const result = await db
        .from("expenses")
        .insert({ ...values, status: "committed" });
      check(result.error);
    }
  });
}
export async function approveExpense(form: FormData): Promise<Result> {
  return run(async () => {
    const result = await database()
      .from("expenses")
      .update({ status: "actual" })
      .eq("id", id(form))
      .eq("status", "committed")
      .select("id")
      .maybeSingle();
    check(result.error);
    if (!result.data)
      throw new Error(
        "This expense was already approved or removed. Refresh the page.",
      );
  });
}
export async function deleteExpense(form: FormData): Promise<Result> {
  return run(async () => {
    const result = await database()
      .from("expenses")
      .delete()
      .eq("id", id(form))
      .select("id")
      .single();
    check(result.error);
  });
}
export async function upsertBudget(form: FormData): Promise<Result> {
  return run(async () => {
    const month = date(form, "month");
    if (!month.endsWith("-01"))
      throw new Error("Select the first day of the budget month.");
    const result = await database()
      .from("budgets")
      .upsert(
        {
          category_id: id(form, "category_id"),
          month,
          approved_amount: amount(form, "approved_amount", true),
        },
        { onConflict: "category_id,month" },
      );
    check(result.error);
  });
}
export async function deleteBudget(form: FormData): Promise<Result> {
  return run(async () => {
    const result = await database()
      .from("budgets")
      .delete()
      .eq("id", id(form))
      .select("id")
      .single();
    check(result.error);
  });
}
export async function saveCategory(form: FormData): Promise<Result> {
  return run(async () => {
    const name = text(form, "name", 80);
    if (!name) throw new Error("Category name is required.");
    const db = database();
    const result = form.get("id")
      ? await db
          .from("categories")
          .update({ name })
          .eq("id", id(form))
          .select("id")
          .single()
      : await db.from("categories").insert({ name });
    check(result.error);
  });
}
export async function deleteCategory(form: FormData): Promise<Result> {
  return run(async () => {
    const db = database();
    const category = id(form);
    const results = await Promise.all([
      db
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("category_id", category),
      db
        .from("budgets")
        .select("id", { count: "exact", head: true })
        .eq("category_id", category),
    ]);
    for (const result of results) {
      check(result.error);
      if (result.count)
        throw new Error(
          "This category has budgets or expenses. Remove or reassign them before deleting it.",
        );
    }
    const result = await db
      .from("categories")
      .delete()
      .eq("id", category)
      .select("id")
      .single();
    check(result.error);
  });
}

// Runs the PRD success scenario against the configured Supabase project.
// It creates uniquely named records and removes only those records on exit.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Run `vercel env pull .env.local` first.");

const db = createClient(url, key, { auth: { persistSession: false } });
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const categoryName = `Codex acceptance ${suffix}`;
const month = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
});
let categoryId;
let app;
let browser;
const baseUrl = process.env.ACCEPTANCE_BASE_URL ?? "http://localhost:3101";

async function cleanup() {
  if (!categoryId) {
    const result = await db
      .from("categories")
      .select("id")
      .eq("name", categoryName)
      .maybeSingle();
    categoryId = result.data?.id;
  }
  if (!categoryId) return;
  const results = await Promise.all([
    db.from("expenses").delete().eq("category_id", categoryId),
    db.from("budgets").delete().eq("category_id", categoryId),
  ]);
  for (const result of results) if (result.error) throw result.error;
  const removed = await db.from("categories").delete().eq("id", categoryId);
  if (removed.error) throw removed.error;
}

try {
  let logs = "";
  if (!process.env.ACCEPTANCE_BASE_URL) {
    app = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-p", "3101"],
      { stdio: "pipe", env: process.env },
    );
    app.stdout.on("data", (chunk) => (logs += chunk));
    app.stderr.on("data", (chunk) => (logs += chunk));
  }
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (attempt === 59) throw new Error(`App did not start.\n${logs}`);
  }

  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const go = (path) =>
    page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  const saved = () =>
    page
      .getByRole("status")
      .filter({ hasText: "Saved successfully." })
      .waitFor();

  await go("/categories");
  await page.getByLabel("Category name", { exact: true }).fill(categoryName);
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await saved();
  const category = await db
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .single();
  if (category.error) throw category.error;
  categoryId = category.data.id;

  await go(`/budgets?month=${month}`);
  await page.getByLabel("Category", { exact: true }).selectOption(categoryId);
  await page.getByLabel("Approved amount ($)", { exact: true }).fill("10000");
  await page.getByRole("button", { name: "Set budget", exact: true }).click();
  await saved();

  async function addExpense(vendor, amount) {
    await go(`/expenses?month=${month}`);
    await page
      .getByRole("button", { name: "+ Add expense", exact: true })
      .click();
    await page.getByLabel("Category", { exact: true }).selectOption(categoryId);
    await page.getByLabel("Vendor", { exact: true }).fill(vendor);
    await page.getByLabel("Amount ($)", { exact: true }).fill(String(amount));
    await page.getByLabel("Expense date", { exact: true }).fill(`${month}-30`);
    await page
      .getByLabel("Description", { exact: true })
      .fill("PRD success scenario");
    await page
      .getByLabel("Notes", { exact: true })
      .fill("Live acceptance check");
    await page
      .getByRole("button", { name: "Save expense", exact: true })
      .click();
    await saved();
  }

  await addExpense(`Meta ${suffix}`, 3200);
  const row = page.getByRole("row").filter({ hasText: `Meta ${suffix}` });
  await row.getByRole("button", { name: "Approve", exact: true }).click();
  await saved();

  await go(`/?month=${month}`);
  let dashboardRow = page.getByRole("row").filter({ hasText: categoryName });
  assert.match(
    await dashboardRow.innerText(),
    /\$10,000\.00.*\$0\.00.*\$3,200\.00.*\$6,800\.00/s,
  );
  await page.getByRole("link", { name: new RegExp(`Meta ${suffix}`) }).click();
  await page
    .getByRole("heading", { name: `Meta ${suffix}`, exact: true })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /Live acceptance check/);

  await addExpense(`Google Ads ${suffix}`, 2000);
  await go(`/?month=${month}`);
  dashboardRow = page.getByRole("row").filter({ hasText: categoryName });
  assert.match(
    await dashboardRow.innerText(),
    /\$10,000\.00.*\$2,000\.00.*\$3,200\.00.*\$4,800\.00/s,
  );
  await page.screenshot({
    path: process.env.LIVE_SCREENSHOT_PATH,
    fullPage: true,
  });
  console.log(
    `PASS: ${baseUrl} completed the live Supabase scenario for ${categoryName}; dashboard reached $4,800.00 remaining.`,
  );
} finally {
  await browser?.close();
  app?.kill();
  await cleanup();
}

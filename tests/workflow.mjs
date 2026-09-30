// Exercises the real Next.js forms + server actions against a disposable API simulator.
// This is not a substitute for the same scenario on the provisioned Supabase project.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { startDatabase } from "./fake-postgrest.mjs";
const { server, tables, faults } = await startDatabase();
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3100"],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-only-anon-key",
    },
    stdio: "pipe",
  },
);
let logs = "";
app.stdout.on("data", (c) => (logs += c));
app.stderr.on("data", (c) => (logs += c));
let browser;
let page;
try {
  for (let i = 0; i < 90; i++) {
    try {
      const response = await fetch("http://localhost:3100");
      if (response.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const go = (path) =>
    page.goto("http://localhost:3100" + path, { waitUntil: "networkidle" });
  const saved = () =>
    page
      .getByRole("status")
      .filter({ hasText: "Saved successfully." })
      .waitFor();
  await go("/categories");
  await page.getByLabel("Category name", { exact: true }).fill("Digital Ads");
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await saved();
  assert.equal(tables.categories.length, 1);
  await go("/budgets?month=2026-09");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Digital Ads" });
  await page.getByLabel("Approved amount ($)", { exact: true }).fill("10000");
  await page.getByRole("button", { name: "Set budget", exact: true }).click();
  await saved();
  assert.equal(tables.budgets[0].approved_amount, 10000);
  async function add(vendor, amount) {
    await page
      .getByRole("button", { name: "+ Add expense", exact: true })
      .click();
    await page
      .getByLabel("Category", { exact: true })
      .selectOption({ label: "Digital Ads" });
    await page.getByLabel("Vendor", { exact: true }).fill(vendor);
    await page.getByLabel("Amount ($)", { exact: true }).fill(String(amount));
    await page.getByLabel("Expense date").fill("2026-09-30");
    await page.getByLabel("Description", { exact: true }).fill("Nov campaign");
    await page
      .getByLabel("Notes", { exact: true })
      .fill("Reviewed campaign plan");
    await page
      .getByRole("button", { name: "Save expense", exact: true })
      .click();
    await saved();
  }
  await go("/expenses?month=2026-09");
  await add("Meta", 3200);
  assert.equal(tables.expenses[0].status, "committed");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await saved();
  assert.equal(tables.expenses[0].status, "actual");
  await go("/?month=2026-09");
  let row = page.getByRole("row").filter({ hasText: "Digital Ads" });
  assert.match(
    await row.innerText(),
    /\$10,000\.00.*\$0\.00.*\$3,200\.00.*\$6,800\.00/s,
  );
  await page.getByRole("link", { name: /Meta/ }).click();
  await page.getByRole("heading", { name: "Meta", exact: true }).waitFor();
  assert.match(await page.locator("main").innerText(), /2026-09-30/);
  assert.match(
    await page.locator("main").innerText(),
    /Reviewed campaign plan/,
  );
  await go("/expenses?month=2026-09");
  await add("Google Ads", 2000);
  await go("/?month=2026-09");
  row = page.getByRole("row").filter({ hasText: "Digital Ads" });
  assert.match(
    await row.innerText(),
    /\$10,000\.00.*\$2,000\.00.*\$3,200\.00.*\$4,800\.00/s,
  );
  await page.screenshot({
    path: process.env.SCREENSHOT_PATH ?? "tests/dashboard.png",
    fullPage: true,
  });
  await page.getByLabel("Month", { exact: true }).fill("2026-10");
  await page.getByLabel("Month", { exact: true }).press("Tab");
  await page.getByText("No budgets set for October 2026").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/?month=2026-09");
  await page.screenshot({
    path: (process.env.SCREENSHOT_PATH ?? "tests/dashboard.png").replace(
      ".png",
      "-mobile.png",
    ),
    fullPage: true,
  });
  await page.getByRole("button", { name: "☰ Menu" }).click();
  await page
    .locator("#navigation")
    .getByRole("link", { name: /Expenses/ })
    .click();
  await page.getByRole("heading", { name: "Expenses", exact: true }).waitFor();
  await go("/expenses?month=2026-09");
  let metaRow = page.getByRole("row").filter({ hasText: "Meta" });
  await metaRow.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Amount ($)", { exact: true }).fill("3100");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await saved();
  assert.equal(
    tables.expenses.find((e) => e.vendor === "Meta").status,
    "committed",
  );
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("row")
    .filter({ hasText: "Google Ads" })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  assert.equal(tables.expenses.length, 2);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("row")
    .filter({ hasText: "Google Ads" })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await saved();
  assert.equal(tables.expenses.length, 1);
  await go("/categories");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "This category has budgets or expenses" })
    .waitFor();
  assert.equal(tables.categories.length, 1);
  await page.getByLabel("Category name", { exact: true }).fill("Events");
  faults.write = true;
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Could not save" }).waitFor();
  assert.equal(
    await page.getByLabel("Category name", { exact: true }).inputValue(),
    "Events",
  );
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await saved();
  const newCategory = page
    .locator("form")
    .filter({ has: page.getByLabel("Category Events", { exact: true }) });
  await page.getByLabel("Category Events", { exact: true }).fill("Events & PR");
  await newCategory.getByRole("button", { name: "Save", exact: true }).click();
  await saved();
  assert.ok(tables.categories.some((c) => c.name === "Events & PR"));
  page.once("dialog", (d) => d.accept());
  await page
    .locator("form")
    .filter({ has: page.getByLabel("Category Events & PR", { exact: true }) })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await saved();
  assert.equal(tables.categories.length, 1);
  await go("/budgets?month=2026-09");
  await page.getByLabel("Digital Ads approved amount").fill("12000");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await saved();
  assert.equal(tables.budgets[0].approved_amount, 12000);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await saved();
  assert.equal(tables.budgets.length, 0);
  assert.equal(tables.expenses.length, 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: PRD 6800/4800 scenario, details, month isolation, mobile nav, full category/budget CRUD, expense edits/reapproval, delete cancel/confirm, protected category, failed write retains input and retries.",
  );
} catch (e) {
  if (page)
    console.error(
      "PAGE:",
      page.url(),
      await page.locator("body").innerText(),
      "DATA:",
      tables,
    );
  console.error(logs.slice(-4000));
  throw e;
} finally {
  await browser?.close();
  app.kill();
  server.close();
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Snapshot, Expense } from "@/lib/types";
import {
  saveExpense,
  approveExpense,
  deleteExpense,
  upsertBudget,
  deleteBudget,
  saveCategory,
  deleteCategory,
  type Result,
} from "@/lib/actions";
import { money } from "@/lib/format";

export function Tracker({
  data,
  month,
  section,
}: {
  data: Snapshot;
  month: string;
  section: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<Result | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);
  const categories = data.categories;
  const name = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Category";
  function submit(
    action: (form: FormData) => Promise<Result>,
    form: FormData,
    done?: () => void,
  ) {
    setNotice(null);
    start(async () => {
      try {
        const result = await action(form);
        setNotice(result);
        if (result.ok) {
          done?.();
        }
      } catch {
        setNotice({
          ok: false,
          message: "Could not save — try again. Your input has been kept.",
        });
      }
    });
  }
  function record(
    action: (form: FormData) => Promise<Result>,
    id: string,
    confirm?: string,
  ) {
    if (confirm && !window.confirm(confirm)) return;
    const form = new FormData();
    form.set("id", id);
    submit(action, form);
  }
  const options = (
    <>
      <option value="" disabled>
        Select category
      </option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </>
  );
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">MARCOM WORKSPACE</p>
          <h1>
            {section === "expenses"
              ? "Expenses"
              : section === "budgets"
                ? "Monthly budgets"
                : "Categories"}
          </h1>
          <p className="muted">
            {section === "expenses"
              ? "Every commitment, from first entry to final approval."
              : section === "budgets"
                ? "Give each category a clear spending limit."
                : "Organize your team’s marketing spend."}
          </p>
        </div>
        {section !== "categories" && (
          <label className="month-control">
            Month
            <input
              aria-label="Month"
              type="month"
              value={month.slice(0, 7)}
              onChange={(e) =>
                e.target.value &&
                router.push(`/${section}?month=${e.target.value}`)
              }
            />
          </label>
        )}
      </header>
      {notice && (
        <div
          role={notice.ok ? "status" : "alert"}
          className={`notice ${notice.ok ? "success" : "failure"}`}
        >
          {notice.message}
        </div>
      )}
      {section === "expenses" && (
        <>
          <div className="toolbar">
            <span>
              {data.expenses.length} expenses ·{" "}
              {data.expenses.filter((e) => e.status === "committed").length}{" "}
              pending approval
            </span>
            <button
              disabled={!categories.length}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              + Add expense
            </button>
          </div>
          {!categories.length && (
            <div className="empty">
              Create a category before logging an expense.{" "}
              <Link href="/categories">Add category →</Link>
            </div>
          )}
          {open && (
            <section className="panel form-panel">
              <h2>{editing ? "Edit expense" : "Add expense"}</h2>
              <p className="muted">
                {editing?.status === "actual"
                  ? "Saving changes returns this expense to pending approval."
                  : "New expenses remain committed until approved."}
              </p>
              <form
                key={editing?.id ?? "new"}
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(saveExpense, new FormData(e.currentTarget), () => {
                    setOpen(false);
                    setEditing(null);
                  });
                }}
              >
                {editing && (
                  <input type="hidden" name="id" value={editing.id} />
                )}
                <fieldset disabled={pending}>
                  <div className="form-grid">
                    <label>
                      Category
                      <select
                        aria-label="Category"
                        name="category_id"
                        required
                        defaultValue={editing?.category_id ?? ""}
                      >
                        {options}
                      </select>
                    </label>
                    <label>
                      Vendor
                      <input
                        name="vendor"
                        required
                        maxLength={120}
                        defaultValue={editing?.vendor}
                        placeholder="e.g. Meta"
                      />
                    </label>
                    <label>
                      Amount ($)
                      <input
                        name="amount"
                        type="number"
                        min="0.01"
                        max="9999999999.99"
                        step="0.01"
                        required
                        defaultValue={editing?.amount}
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      Expense date
                      <input
                        name="expense_date"
                        type="date"
                        required
                        defaultValue={editing?.expense_date ?? month}
                      />
                    </label>
                    <label className="wide">
                      Description
                      <input
                        name="description"
                        maxLength={500}
                        defaultValue={editing?.description}
                        placeholder="What is this expense for?"
                      />
                    </label>
                    <label className="wide">
                      Notes
                      <textarea
                        name="notes"
                        maxLength={2000}
                        defaultValue={editing?.notes}
                        placeholder="Context for your reviewer"
                      />
                    </label>
                  </div>
                  <div className="actions">
                    <button>{pending ? "Saving…" : "Save expense"}</button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </fieldset>
              </form>
            </section>
          )}
          <section className="panel">
            <div className="panel-heading">
              <h2>Expense ledger</h2>
              <span className="muted">Select a vendor to view details</span>
            </div>
            {!data.expenses.length ? (
              <div className="empty">
                <h3>No expenses yet</h3>
                <p>
                  Add your first expense for this month to start tracking spend.
                </p>
                <button
                  disabled={!categories.length}
                  onClick={() => setOpen(true)}
                >
                  Add expense
                </button>
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor / expense</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th className="numeric">Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <Link className="vendor" href={`/expenses/${e.id}`}>
                            {e.vendor}
                          </Link>
                          <small>{e.description}</small>
                        </td>
                        <td>{name(e.category_id)}</td>
                        <td>{e.expense_date}</td>
                        <td className="numeric">{money(Number(e.amount))}</td>
                        <td>
                          <span className={`badge ${e.status}`}>
                            {e.status === "actual" ? "Actual" : "Committed"}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="small secondary"
                              disabled={pending || e.status === "actual"}
                              onClick={() => record(approveExpense, e.id)}
                            >
                              {e.status === "actual" ? "Approved" : "Approve"}
                            </button>
                            <button
                              className="text-button"
                              disabled={pending}
                              onClick={() => {
                                setEditing(e);
                                setOpen(true);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-button danger"
                              disabled={pending}
                              onClick={() =>
                                record(
                                  deleteExpense,
                                  e.id,
                                  `Delete ${e.vendor} expense for ${money(Number(e.amount))}? This cannot be undone.`,
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {section === "budgets" && (
        <>
          <section className="panel form-panel">
            <h2>Set a budget</h2>
            <p className="muted">
              Saving an existing category updates its approved amount for this
              month.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(upsertBudget, new FormData(e.currentTarget));
              }}
            >
              <fieldset disabled={pending}>
                <input type="hidden" name="month" value={month} />
                <div className="inline-form">
                  <label>
                    Category
                    <select
                      aria-label="Category"
                      name="category_id"
                      required
                      defaultValue=""
                    >
                      {options}
                    </select>
                  </label>
                  <label>
                    Approved amount ($)
                    <input
                      required
                      name="approved_amount"
                      type="number"
                      min="0"
                      max="9999999999.99"
                      step="0.01"
                      placeholder="10000.00"
                    />
                  </label>
                  <button disabled={!categories.length}>
                    {pending ? "Saving…" : "Set budget"}
                  </button>
                </div>
              </fieldset>
            </form>
            {!categories.length && (
              <Link href="/categories">Add your first category →</Link>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Approved budgets</h2>
              <strong>
                {money(
                  data.budgets.reduce(
                    (s, b) => s + Number(b.approved_amount),
                    0,
                  ),
                )}{" "}
                total
              </strong>
            </div>
            {!data.budgets.length ? (
              <div className="empty">
                <h3>No budget set for this month</h3>
                <p>Use the form above to set your first category budget.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Approved amount / actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.budgets.map((b) => (
                      <tr key={b.id}>
                        <td>{name(b.category_id)}</td>
                        <td>
                          <form
                            className="inline-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              submit(
                                upsertBudget,
                                new FormData(e.currentTarget),
                              );
                            }}
                          >
                            <input type="hidden" name="month" value={month} />
                            <input
                              type="hidden"
                              name="category_id"
                              value={b.category_id}
                            />
                            <input
                              aria-label={`${name(b.category_id)} approved amount`}
                              name="approved_amount"
                              required
                              type="number"
                              min="0"
                              max="9999999999.99"
                              step="0.01"
                              defaultValue={b.approved_amount}
                              key={b.approved_amount}
                            />
                            <button
                              className="secondary small"
                              disabled={pending}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="text-button danger"
                              disabled={pending}
                              onClick={() =>
                                record(
                                  deleteBudget,
                                  b.id,
                                  "Delete this budget? Expenses will be kept and count as unbudgeted spend.",
                                )
                              }
                            >
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {section === "categories" && (
        <>
          <section className="panel form-panel">
            <h2>Add a category</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                submit(saveCategory, new FormData(form), () => form.reset());
              }}
            >
              <fieldset disabled={pending}>
                <div className="inline-form">
                  <label>
                    Category name
                    <input
                      name="name"
                      required
                      maxLength={80}
                      placeholder="e.g. Digital Ads"
                    />
                  </label>
                  <button>{pending ? "Saving…" : "Add category"}</button>
                </div>
              </fieldset>
            </form>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Spend categories</h2>
              <span className="muted">{categories.length} categories</span>
            </div>
            <p className="panel-note">
              Categories used by budgets or expenses must be cleared before
              deletion.
            </p>
            {!categories.length ? (
              <div className="empty">No categories yet — add one above.</div>
            ) : (
              categories.map((c) => (
                <form
                  className="category-row"
                  key={c.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit(saveCategory, new FormData(e.currentTarget));
                  }}
                >
                  <input type="hidden" name="id" value={c.id} />
                  <span className="category-icon">◈</span>
                  <input
                    aria-label={`Category ${c.name}`}
                    name="name"
                    required
                    maxLength={80}
                    defaultValue={c.name}
                  />
                  <button className="secondary small" disabled={pending}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-button danger"
                    disabled={pending}
                    onClick={() =>
                      record(
                        deleteCategory,
                        c.id,
                        `Delete category “${c.name}”?`,
                      )
                    }
                  >
                    Delete
                  </button>
                </form>
              ))
            )}
          </section>
        </>
      )}
    </>
  );
}

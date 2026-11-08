"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  active,
  currency,
  expenseSchema,
  today,
  type Expense,
  type PlannerState,
} from "@/lib/planner";
import {
  startingSchedule,
  scheduledExpense,
  type Payment,
} from "@/lib/payments";
export function PaymentSchedule({
  expense,
  state,
  busy,
  readOnly,
  onSave,
}: {
  expense: Expense;
  state: PlannerState;
  busy: boolean;
  readOnly: boolean;
  onSave: (expense: Expense) => Promise<void>;
}) {
  const [rows, setRows] = useState(() => startingSchedule(expense)),
    [error, setError] = useState("");
  function patch(id: string, change: Partial<Payment>) {
    setRows(rows.map((p) => (p.id === id ? { ...p, ...change } : p)));
  }
  const total = expense.actual ?? expense.estimate,
    scheduled = rows.reduce((n, p) => n + Math.round(p.amount * 100), 0) / 100,
    paid =
      rows
        .filter((p) => p.paid)
        .reduce((n, p) => n + Math.round(p.amount * 100), 0) / 100;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const next = scheduledExpense(expense, rows);
        const check = expenseSchema.safeParse(next);
        if (!check.success) {
          setError(check.error.issues[0].message);
          return;
        }
        await onSave(check.data);
      }}
    >
      <div className="payment-summary">
        <span>
          Total<strong>{currency(total)}</strong>
        </span>
        <span>
          Paid<strong>{currency(paid)}</strong>
        </span>
        <span>
          Unscheduled
          <strong className={scheduled > total ? "overdue" : ""}>
            {currency(Math.round((total - scheduled) * 100) / 100)}
          </strong>
        </span>
      </div>
      <p className="helper-text">
        Split this expense into a deposit and later instalments. Mark each
        payment when you’ve made it. Previously recorded payments are kept
        without inventing a payment date.
      </p>
      <fieldset className="form-fields" disabled={busy || readOnly}>
        {rows.map((p, i) => (
          <section className="instalment" key={p.id}>
            <div className="section-heading">
              <h3>Payment {i + 1}</h3>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove payment ${i + 1}`}
                onClick={() => setRows(rows.filter((r) => r.id !== p.id))}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Payment name</span>
                <input
                  required
                  maxLength={200}
                  value={p.label}
                  onChange={(e) => patch(p.id, { label: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Amount (£)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={p.amount || ""}
                  onChange={(e) =>
                    patch(p.id, { amount: Number(e.target.value) })
                  }
                />
              </label>
              <label className="field">
                <span>Due date</span>
                <input
                  type="date"
                  value={p.due}
                  onInput={(e) => patch(p.id, { due: e.currentTarget.value })}
                  onChange={(e) => patch(p.id, { due: e.target.value })}
                />
              </label>
              <label className="paid-toggle">
                <input
                  type="checkbox"
                  checked={p.paid}
                  onChange={(e) =>
                    patch(p.id, {
                      paid: e.target.checked,
                      paidOn: e.target.checked ? today() : "",
                    })
                  }
                />{" "}
                Paid
              </label>
              {p.paid && (
                <label className="field">
                  <span>Date paid (optional)</span>
                  <input
                    type="date"
                    value={p.paidOn}
                    onInput={(e) =>
                      patch(p.id, { paidOn: e.currentTarget.value })
                    }
                    onChange={(e) => patch(p.id, { paidOn: e.target.value })}
                  />
                </label>
              )}
              <label className="field">
                <span>Receipt (optional)</span>
                <select
                  value={p.receiptId}
                  onChange={(e) => patch(p.id, { receiptId: e.target.value })}
                >
                  <option value="">No receipt linked</option>
                  {active(state.documents).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        ))}
        <button
          className="button secondary"
          type="button"
          disabled={rows.length >= 100}
          onClick={() =>
            setRows([
              ...rows,
              {
                id: crypto.randomUUID(),
                label: "Instalment",
                amount: Math.max(
                  0,
                  Math.round((total - scheduled) * 100) / 100,
                ),
                due: "",
                paid: false,
                paidOn: "",
                receiptId: "",
              },
            ])
          }
        >
          <Plus size={16} /> Add instalment
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!readOnly && (
          <div className="form-actions">
            <button className="button primary" type="submit">
              {busy ? "Saving…" : "Save payment schedule"}
            </button>
          </div>
        )}
      </fieldset>
      {readOnly && <p className="helper-text">Your access is read only.</p>}
    </form>
  );
}

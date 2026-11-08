import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  stateSchema,
  budgetTotals,
  guestsFromCsv,
  makeCsv,
  parseCsv,
  checklist,
  dayDistance,
  demoState,
} from "../lib/planner.ts";
const expense = {
  id: "a",
  name: "Venue",
  category: "Venue",
  estimate: 5000,
  actual: null,
  paid: 0,
  due: "",
  vendor: "",
  notes: "",
  archived: false,
};
test("forecast uses estimates only until an actual cost is agreed, including an agreed zero", () => {
  assert.equal(budgetTotals([expense], 6000).remaining, 1000);
  assert.equal(budgetTotals([{ ...expense, actual: 0 }], 6000).remaining, 6000);
  assert.equal(
    budgetTotals([{ ...expense, actual: 7000, paid: 2000 }], 6000).outstanding,
    5000,
  );
  assert.equal(
    budgetTotals([{ ...expense, actual: 7000 }], 6000).remaining,
    -1000,
  );
  assert.equal(
    budgetTotals([{ ...expense, archived: true }], 6000).forecast,
    0,
  );
});
test("server validation rejects negative costs, overpayments and invalid dates", () => {
  for (const patch of [
    { estimate: -1 },
    { paid: 6000 },
    { due: "2026-02-30" },
  ]) {
    const s = emptyState();
    s.expenses = [{ ...expense, ...patch }];
    assert.equal(stateSchema.safeParse(s).success, false);
  }
});
test("CSV handles quoted commas, embedded newlines, BOM, and escapes formulas on export", () => {
  const csv =
    '\uFEFFName,Email,Dietary\r\n"Guest, One",,"No nuts\nNo dairy"\r\n';
  const list = guestsFromCsv(csv);
  assert.equal(list[0].name, "Guest, One");
  assert.equal(list[0].dietary, "No nuts\nNo dairy");
  assert.match(makeCsv(["Name"], [['=HYPERLINK("bad")']]), /\'=HYPERLINK/);
  assert.deepEqual(parseCsv('Name,Notes\n"A ""B""",ok'), [
    ["Name", "Notes"],
    ['A "B"', "ok"],
  ]);
  assert.throws(() => guestsFromCsv("Email\na@b.com"), /Name/);
  assert.throws(() => guestsFromCsv("Name,Email\nA,not-email"), /Row 2/);
});
test("seating enforces confirmed guests, active tables, and capacity", () => {
  const s = emptyState();
  s.tables = [{ id: "t", name: "Table 1", capacity: 1, archived: false }];
  const g = {
    id: "g",
    name: "A",
    email: "",
    group: "",
    household: "",
    rsvp: "confirmed",
    meal: "",
    dietary: "",
    table: "t",
    notes: "",
    archived: false,
  };
  s.guests = [g];
  assert.equal(stateSchema.safeParse(s).success, true);
  s.guests.push({ ...g, id: "g2" });
  assert.equal(stateSchema.safeParse(s).success, false);
  s.guests = [{ ...g, rsvp: "pending" }];
  assert.equal(stateSchema.safeParse(s).success, false);
  s.guests = [g];
  s.tables[0].archived = true;
  assert.equal(stateSchema.safeParse(s).success, false);
});
test("checklist dates are relative and samples contain no hard-coded countdown", () => {
  const tasks = checklist("2030-06-15");
  assert.equal(dayDistance("2030-06-15", tasks[0].due), 365);
  assert.ok(checklist("").every((t) => t.due === ""));
  assert.ok(checklist("2020-01-01").every((t) => dayDistance(t.due) >= 0));
  assert.equal(stateSchema.safeParse(demoState()).success, true);
});
test("duplicate IDs are rejected to avoid updating two guests at once", () => {
  const s = emptyState();
  s.expenses = [expense, expense];
  assert.equal(stateSchema.safeParse(s).success, false);
});

const { startingSchedule, scheduledExpense, pendingPayments, paymentCalendar } =
  await import("../lib/payments.ts");
const { visiblePlan, permittedUpdate } = await import("../lib/access.ts");
test("legacy deposits are retained when creating a schedule; due dates follow unpaid instalments", () => {
  const legacy = { ...expense, paid: 1000, due: "2030-03-01" };
  const rows = startingSchedule(legacy);
  assert.equal(rows[0].amount, 1000);
  assert.equal(rows[0].paidOn, "");
  assert.equal(rows[1].amount, 4000);
  const next = scheduledExpense(legacy, rows);
  assert.equal(next.paid, 1000);
  assert.equal(next.due, "2030-03-01");
  rows[1].paid = true;
  rows[1].paidOn = "2030-03-01";
  const paid = scheduledExpense(legacy, rows);
  assert.equal(paid.paid, 5000);
  assert.equal(paid.due, "");
  assert.equal(pendingPayments([paid]).length, 0);
  const s = emptyState();
  s.expenses = [legacy];
  assert.deepEqual(stateSchema.parse(s).expenses[0].schedule, []);
});
test("payment schedules reject over-allocation, duplicate IDs and inconsistent paid totals", () => {
  const rows = [
    {
      id: "p",
      label: "Deposit",
      amount: 1000,
      due: "2030-01-01",
      paid: true,
      paidOn: "2030-01-01",
      receiptId: "",
    },
    {
      id: "p2",
      label: "Balance",
      amount: 4000,
      due: "2030-03-01",
      paid: false,
      paidOn: "",
      receiptId: "",
    },
  ];
  const next = scheduledExpense(expense, rows),
    s = emptyState();
  s.expenses = [next];
  assert.ok(stateSchema.safeParse(s).success);
  for (const broken of [
    { ...next, paid: 1001 },
    { ...next, due: "2030-01-01" },
    { ...next, schedule: [rows[0], { ...rows[1], amount: 4001 }] },
    { ...next, schedule: [rows[0], { ...rows[1], id: "p" }] },
  ]) {
    s.expenses = [broken];
    assert.equal(stateSchema.safeParse(s).success, false);
  }
});
test("calendar contains each unpaid instalment, escaped titles, stable IDs and two alarms", () => {
  const s = emptyState();
  s.expenses = [
    scheduledExpense(
      { ...expense, name: "Venue, garden; north\\south\nRoom" },
      [
        {
          id: "p",
          label: "Balance",
          amount: 5000,
          due: "2030-03-01",
          paid: false,
          paidOn: "",
          receiptId: "",
        },
      ],
    ),
  ];
  const cal = paymentCalendar(s, new Date("2029-01-01T00:00:00Z"));
  assert.match(cal, /UID:a-p@our-wedding-planner/);
  assert.match(cal, /DTSTART;VALUE=DATE:20300301/);
  assert.match(cal, /DTEND;VALUE=DATE:20300302/);
  assert.match(cal, /TRIGGER:-P7D/);
  assert.match(cal, /TRIGGER:-P1D/);
  assert.match(cal, /Venue\\, garden\\; north\\\\south\\nRoom/);
  assert.ok(cal.endsWith("END:VCALENDAR\r\n"));
  assert.ok(cal.split("\r\n").every((l) => Buffer.byteLength(l) <= 75));
});
test("planner role receives no finances or documents and cannot replace private details", () => {
  const s = emptyState();
  s.expenses = [{ ...expense, schedule: [] }];
  s.documents = [
    {
      id: "doc",
      name: "contract",
      key: "owner/doc",
      size: 1,
      type: "text/plain",
      folder: "Contracts",
      archived: false,
    },
  ];
  const view = visiblePlan(s, "planner");
  assert.equal(view.settings.budget, 0);
  assert.deepEqual(view.expenses, []);
  assert.deepEqual(view.documents, []);
  const merged = permittedUpdate(
    s,
    { ...view, settings: { ...view.settings, budget: 999 } },
    "planner",
  );
  assert.equal(merged.settings.budget, s.settings.budget);
  assert.deepEqual(merged.expenses, s.expenses);
  assert.deepEqual(merged.documents, s.documents);
  assert.throws(() => permittedUpdate(s, s, "planner"));
  assert.throws(() => permittedUpdate(s, s, "viewer"));
});

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

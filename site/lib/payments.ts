import {
  active,
  currency,
  type Expense,
  type PlannerState,
} from "./planner.ts";
export type Payment = NonNullable<Expense["schedule"]>[number];
const cents = (value: number) => Math.round(value * 100);
export function scheduledExpense(
  expense: Expense,
  schedule: Payment[],
): Expense {
  return {
    ...expense,
    schedule,
    paid:
      schedule.filter((p) => p.paid).reduce((n, p) => n + cents(p.amount), 0) /
      100,
    due:
      schedule
        .filter((p) => !p.paid && p.due)
        .map((p) => p.due)
        .sort()[0] || "",
  };
}
export function startingSchedule(expense: Expense): Payment[] {
  if (expense.schedule?.length) return structuredClone(expense.schedule);
  const rows: Payment[] = [];
  if (expense.paid > 0)
    rows.push({
      id: crypto.randomUUID(),
      label: "Previously recorded payments",
      amount: expense.paid,
      due: "",
      paid: true,
      paidOn: "",
      receiptId: "",
    });
  const balance =
    (cents(expense.actual ?? expense.estimate) - cents(expense.paid)) / 100;
  if (balance > 0)
    rows.push({
      id: crypto.randomUUID(),
      label: "Balance",
      amount: balance,
      due: expense.due,
      paid: false,
      paidOn: "",
      receiptId: "",
    });
  return rows;
}
export function pendingPayments(expenses: Expense[]) {
  return active(expenses)
    .flatMap((e) =>
      e.schedule?.length
        ? e.schedule
            .filter((p) => !p.paid && p.due)
            .map((p) => ({
              id: e.id + "-" + p.id,
              expenseId: e.id,
              name: e.name + " · " + p.label,
              due: p.due,
              amount: p.amount,
            }))
        : e.due && (e.actual ?? e.estimate) > e.paid
          ? [
              {
                id: e.id,
                expenseId: e.id,
                name: e.name,
                due: e.due,
                amount: (cents(e.actual ?? e.estimate) - cents(e.paid)) / 100,
              },
            ]
          : [],
    )
    .sort((a, b) => a.due.localeCompare(b.due));
}
const escapeText = (v: string) =>
  v
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
function fold(line: string) {
  const rows: string[] = [];
  let row = "";
  for (const char of line) {
    if (new TextEncoder().encode(row + char).length > 74) {
      rows.push(row);
      row = " ";
    }
    row += char;
  }
  rows.push(row);
  return rows.join("\r\n");
}
export function paymentCalendar(state: PlannerState, now = new Date()) {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Our Wedding//Payment reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Wedding payment reminders",
  ];
  for (const p of pendingPayments(state.expenses)) {
    const end = new Date(p.due + "T12:00:00Z");
    end.setUTCDate(end.getUTCDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${p.id}@our-wedding-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${p.due.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replaceAll("-", "")}`,
      `SUMMARY:${escapeText(p.name + " · " + currency(p.amount))}`,
      `DESCRIPTION:${escapeText("Payment due. Check the latest amount and payment status in your wedding planner. This calendar is a snapshot; re-export after changing your schedule.")}`,
      "STATUS:CONFIRMED",
    );
    for (const days of [7, 1])
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `TRIGGER:-P${days}D`,
        `DESCRIPTION:${escapeText(p.name + " is due " + (days === 1 ? "tomorrow" : "in 7 days"))}`,
        "END:VALARM",
      );
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

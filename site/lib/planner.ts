import { z } from "zod";
import { guestSiteSchema } from "./guest-site-schema.ts";
export function rsvpDeadlineFor(weddingDate: string) {
  return weddingDate
    ? new Date(Date.parse(weddingDate + "T12:00:00Z") - 16 * 7 * 86400000)
        .toISOString()
        .slice(0, 10)
    : "";
}

const text = z.string().trim().max(200);
const note = z.string().max(4000);
const date = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Choose a valid date",
  );
const money = z.number().finite().min(0).max(100000000);
const base = {
  id: z.string().min(1).max(80),
  archived: z.boolean().default(false),
};
export const taskSchema = z.object({
  ...base,
  title: text.min(1),
  due: date,
  category: text,
  owner: text,
  priority: z.enum(["low", "medium", "high"]),
  done: z.boolean(),
  notes: note,
});
export const guestSchema = z.object({
  ...base,
  name: text.min(1),
  email: z.union([z.literal(""), z.string().email().max(200)]),
  group: text,
  household: text,
  rsvp: z.enum(["pending", "confirmed", "declined", "maybe"]),
  meal: text,
  dietary: note,
  accessibility: note.default(""),
  transport: z.enum(["", "yes", "no"]).default(""),
  songRequest: text.default(""),
  message: note.default(""),
  replyEmail: z
    .union([z.literal(""), z.string().trim().email().max(200)])
    .default(""),
  replyPhone: text.default(""),
  table: text,
  notes: note,
});
export const paymentSchema = z
  .object({
    id: z.string().min(1).max(80),
    label: text.min(1),
    amount: money.refine((v) => v > 0, "Payment must be greater than zero"),
    due: date,
    paid: z.boolean(),
    paidOn: date,
    receiptId: z.string().max(80),
  })
  .refine((p) => p.paid || !p.paidOn, {
    message: "Unpaid instalments cannot have a paid date",
    path: ["paidOn"],
  });
export const expenseSchema = z
  .object({
    ...base,
    name: text.min(1),
    category: text,
    estimate: money,
    actual: money.nullable(),
    paid: money,
    due: date,
    vendor: text,
    notes: note,
    schedule: z.array(paymentSchema).max(100).default([]),
  })
  .refine((e) => e.paid <= (e.actual ?? e.estimate), {
    message: "Paid amount cannot exceed the agreed cost or estimate",
    path: ["paid"],
  })
  .superRefine((e, ctx) => {
    if (!e.schedule.length) return;
    const cents = (n: number) => Math.round(n * 100);
    if (new Set(e.schedule.map((p) => p.id)).size !== e.schedule.length)
      ctx.addIssue({ code: "custom", message: "Payment IDs must be unique" });
    if (
      e.schedule.reduce((n, p) => n + cents(p.amount), 0) >
      cents(e.actual ?? e.estimate)
    )
      ctx.addIssue({
        code: "custom",
        message: "Scheduled payments exceed the expense total",
      });
    if (
      e.schedule
        .filter((p) => p.paid)
        .reduce((n, p) => n + cents(p.amount), 0) !== cents(e.paid)
    )
      ctx.addIssue({
        code: "custom",
        message: "Update payments through the payment schedule",
      });
    const due =
      e.schedule
        .filter((p) => !p.paid && p.due)
        .map((p) => p.due)
        .sort()[0] || "";
    if (e.due !== due)
      ctx.addIssue({
        code: "custom",
        message: "The next due date must match your payment schedule",
      });
  });
export const vendorSchema = z.object({
  ...base,
  name: text.min(1),
  category: text,
  status: z.enum(["researching", "contacted", "shortlisted", "booked"]),
  email: z.union([z.literal(""), z.string().email().max(200)]),
  phone: text,
  website: z
    .union([z.literal(""), z.string().url().max(1000)])
    .refine((v) => !v || /^https?:\/\//i.test(v), "Use an http or https link"),
  notes: note,
});
export const tableSchema = z.object({
  ...base,
  name: text.min(1),
  capacity: z.number().int().min(1).max(100),
});
export const eventSchema = z.object({
  ...base,
  title: text.min(1),
  date,
  time: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/),
  location: text,
  owner: text,
  notes: note,
});
export const documentSchema = z.object({
  ...base,
  name: text.min(1),
  key: z.string().max(300),
  size: z
    .number()
    .int()
    .min(0)
    .max(10 * 1024 * 1024),
  type: text,
  folder: text,
});
export const settingsSchema = z
  .object({
    name: text.min(1),
    partner1: text,
    partner2: text,
    date,
    venue: text,
    budget: money,
    guestTarget: z.number().int().min(0).max(10000),
    rsvpDeadline: date,
  })
  .transform((settings) => ({
    ...settings,
    rsvpDeadline: rsvpDeadlineFor(settings.date),
  }));
export const stateSchema = z
  .object({
    schemaVersion: z.literal(1),
    settings: settingsSchema,
    guestSite: guestSiteSchema.default({}),
    tasks: z.array(taskSchema).max(2000),
    guests: z.array(guestSchema).max(2000),
    expenses: z.array(expenseSchema).max(1000),
    vendors: z.array(vendorSchema).max(500),
    tables: z.array(tableSchema).max(300),
    events: z.array(eventSchema).max(500),
    documents: z.array(documentSchema).max(300),
  })
  .superRefine((s, ctx) => {
    for (const collection of [
      "tasks",
      "guests",
      "expenses",
      "vendors",
      "tables",
      "events",
      "documents",
    ] as const) {
      const ids = s[collection].map((x) => x.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({
          code: "custom",
          message: "Duplicate record IDs",
          path: [collection],
        });
    }
    for (const guest of s.guests.filter((g) => !g.archived && g.table)) {
      const table = s.tables.find((t) => t.id === guest.table && !t.archived);
      if (!table || guest.rsvp !== "confirmed")
        ctx.addIssue({
          code: "custom",
          message: "Only confirmed guests can be assigned to an active table",
          path: ["guests"],
        });
    }
    for (const table of s.tables.filter((t) => !t.archived)) {
      if (
        s.guests.filter((g) => !g.archived && g.table === table.id).length >
        table.capacity
      )
        ctx.addIssue({
          code: "custom",
          message: `${table.name} is over capacity`,
          path: ["tables"],
        });
    }
  });
export type PlannerState = z.infer<typeof stateSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Guest = z.infer<typeof guestSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type Vendor = z.infer<typeof vendorSchema>;
export type SeatingTable = z.infer<typeof tableSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Document = z.infer<typeof documentSchema>;
export type Collection =
  | "tasks"
  | "guests"
  | "expenses"
  | "vendors"
  | "tables"
  | "events"
  | "documents";
export type Item =
  | Task
  | Guest
  | Expense
  | Vendor
  | SeatingTable
  | Event
  | Document;
export const emptyState = (): PlannerState => ({
  schemaVersion: 1,
  guestSite: guestSiteSchema.parse({}),
  settings: {
    name: "Our Wedding",
    partner1: "",
    partner2: "",
    date: "",
    venue: "",
    budget: 15000,
    guestTarget: 0,
    rsvpDeadline: "",
  },
  tasks: [],
  guests: [],
  expenses: [],
  vendors: [],
  tables: [],
  events: [],
  documents: [],
});
export const currency = (v: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: v % 1 ? 2 : 0,
  }).format(v);
export const formatDate = (v: string) =>
  v
    ? new Date(v + "T12:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No date set";
export const today = () => new Date().toLocaleDateString("en-CA");
export const dayDistance = (v: string, from = today()) =>
  Math.round(
    (Date.parse(v + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 86400000,
  );
export const active = <T extends { archived: boolean }>(items: T[]) =>
  items.filter((i) => !i.archived);
export function budgetTotals(items: Expense[], budget: number) {
  const current = active(items);
  const forecast = current.reduce((n, i) => n + (i.actual ?? i.estimate), 0);
  const paid = current.reduce((n, i) => n + i.paid, 0);
  return {
    forecast,
    paid,
    outstanding: Math.max(0, forecast - paid),
    remaining: budget - forecast,
    estimated: current.reduce((n, i) => n + i.estimate, 0),
  };
}
export function checklist(weddingDate: string): Task[] {
  const templates: [string, string, number][] = [
    ["Agree your budget and priorities", "Budget", 365],
    ["Draft your guest list", "Guests", 330],
    ["Shortlist and visit venues", "Venue", 300],
    ["Book your photographer", "Photography", 240],
    ["Check ceremony and notice requirements", "Ceremony", 180],
    ["Send invitations", "Guests", 120],
    ["Confirm menus and dietary requirements", "Catering", 45],
    ["Finalise the seating plan", "Guests", 21],
    ["Confirm supplier timings and balances", "Planning", 14],
    ["Share your wedding-day schedule", "Planning", 7],
  ];
  return templates.map(([title, category, days]) => ({
    id: crypto.randomUUID(),
    title,
    category,
    owner: "Together",
    priority: "medium",
    due: weddingDate
      ? [
          today(),
          new Date(Date.parse(weddingDate + "T12:00:00Z") - days * 86400000)
            .toISOString()
            .slice(0, 10),
        ]
          .sort()
          .pop()!
      : "",
    notes: "Suggested timing — adjust this to suit your wedding.",
    done: false,
    archived: false,
  }));
}
export function demoState(): PlannerState {
  const s = emptyState();
  const date = new Date();
  date.setDate(date.getDate() + 240);
  s.settings = {
    name: "Alex & Jamie",
    partner1: "Alex",
    partner2: "Jamie",
    date: date.toISOString().slice(0, 10),
    venue: "The Glasshouse",
    budget: 24000,
    guestTarget: 80,
    rsvpDeadline: "",
  };
  s.tasks = checklist(s.settings.date);
  s.tasks[0].done = true;
  s.tasks[1].done = true;
  s.tasks[2].done = true;
  s.expenses = [
    {
      schedule: [],
      id: "d-e1",
      name: "Venue & reception",
      category: "Venue",
      estimate: 9000,
      actual: 8500,
      paid: 2500,
      due: s.tasks[8].due,
      vendor: "",
      notes: "",
      archived: false,
    },
    {
      schedule: [],
      id: "d-e2",
      name: "Wedding photography",
      category: "Photography",
      estimate: 2200,
      actual: 2400,
      paid: 600,
      due: s.tasks[8].due,
      vendor: "",
      notes: "",
      archived: false,
    },
    {
      schedule: [],
      id: "d-e3",
      name: "Flowers & styling",
      category: "Flowers",
      estimate: 1800,
      actual: null,
      paid: 0,
      due: "",
      vendor: "",
      notes: "",
      archived: false,
    },
  ];
  s.guests = [
    "Olivia Bennett",
    "Noah Bennett",
    "Amelia Clark",
    "Leo Harris",
    "Isla Martin",
    "Theo Wilson",
  ].map((name, i) => ({
    accessibility: "",
    transport: "" as const,
    songRequest: "",
    message: "",
    replyEmail: "",
    replyPhone: "",
    id: "d-g" + i,
    name,
    email: "",
    group: i < 3 ? "Family" : "Friends",
    household: i < 2 ? "Bennett household" : "",
    rsvp: i < 4 ? "confirmed" : "pending",
    meal: i === 2 ? "Vegetarian" : "",
    dietary: i === 2 ? "No nuts" : "",
    table: "",
    notes: "",
    archived: false,
  }));
  return s;
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function makeCsv(headers: string[], rows: unknown[][]) {
  return (
    "\uFEFF" +
    [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")
  );
}
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(value);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      value = "";
    } else value += c;
  }
  if (quoted) throw Error("Unclosed quote in CSV");
  row.push(value);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
export function guestsFromCsv(input: string): Guest[] {
  const [header, ...rows] = parseCsv(input.replace(/^\uFEFF/, ""));
  if (!header) throw Error("The file is empty");
  const keys = header.map((h) => h.trim().toLowerCase());
  if (!keys.includes("name"))
    throw Error("Include a Name column. Download the template for an example.");
  return rows.map((row, i) => {
    const get = (k: string) => row[keys.indexOf(k)]?.trim() ?? "";
    const parsed = guestSchema.safeParse({
      id: crypto.randomUUID(),
      archived: false,
      name: get("name"),
      email: get("email"),
      group: get("group"),
      household: get("household"),
      rsvp: get("rsvp").toLowerCase() || "pending",
      meal: get("meal"),
      dietary: get("dietary"),
      table: "",
      notes: get("notes"),
    });
    if (!parsed.success)
      throw Error(`Row ${i + 2}: ${parsed.error.issues[0].message}`);
    return parsed.data;
  });
}

"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import {
  Heart,
  LayoutDashboard,
  CheckSquare2,
  Users,
  Wallet,
  Store,
  Armchair,
  CalendarDays,
  Files,
  Settings2,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  X,
  Menu,
  Check,
  Circle,
  Clock3,
  Download,
  Upload,
  Pencil,
  Archive,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Loader2,
  LogOut,
  Bell,
  MapPin,
  ExternalLink,
  Mail,
  CheckCheck,
} from "lucide-react";
import {
  active,
  budgetTotals,
  checklist,
  currency,
  dayDistance,
  demoState,
  emptyState,
  formatDate,
  guestsFromCsv,
  makeCsv,
  documentSchema,
  stateSchema,
  today,
  type Collection,
  type Document,
  type Expense,
  type Guest,
  type Item,
  type PlannerState,
  type Task,
} from "@/lib/planner";

type Page =
  | "overview"
  | "tasks"
  | "guests"
  | "budget"
  | "vendors"
  | "seating"
  | "timeline"
  | "documents"
  | "settings"
  | "notifications";
const nav = [
  { id: "overview", name: "Overview", icon: LayoutDashboard },
  { id: "tasks", name: "Checklist", icon: CheckSquare2 },
  { id: "guests", name: "Guest list", icon: Users },
  { id: "budget", name: "Budget", icon: Wallet },
  { id: "vendors", name: "Suppliers", icon: Store },
  { id: "seating", name: "Seating plan", icon: Armchair },
  { id: "timeline", name: "Timeline", icon: CalendarDays },
  { id: "documents", name: "Documents", icon: Files },
] as const;
const urls: Record<Page, string> = {
  overview: "/",
  tasks: "/dashboard/tasks",
  guests: "/dashboard/guests",
  budget: "/dashboard/budget",
  vendors: "/dashboard/vendors",
  seating: "/dashboard/seating",
  timeline: "/dashboard/timeline",
  documents: "/dashboard/documents",
  settings: "/dashboard/settings",
  notifications: "/dashboard/notifications",
};
const categories = [
  "Planning",
  "Venue",
  "Guests",
  "Budget",
  "Photography",
  "Catering",
  "Flowers",
  "Music",
  "Attire",
  "Ceremony",
  "Transport",
  "Other",
];
const titles: Record<Page, [string, string]> = {
  overview: [
    "A little closer to your big day.",
    "One lovely day. A thousand little details. All together here.",
  ],
  tasks: [
    "Your checklist",
    "Make room for the exciting parts. Take the rest one step at a time.",
  ],
  guests: [
    "Your favourite people",
    "Every name, reply and dietary detail, in one place.",
  ],
  budget: [
    "Make every pound count",
    "A clear view of what you expect, what you’ve agreed and what you’ve paid.",
  ],
  vendors: [
    "Your wedding team",
    "From your first shortlist to the final confirmation.",
  ],
  seating: [
    "A place for everyone",
    "Bring your confirmed guests together, table by table.",
  ],
  timeline: [
    "Let the day unfold",
    "A shared picture to export for the people making it happen.",
  ],
  documents: [
    "The details, kept together",
    "Contracts, quotes and the things you’ll want to find again.",
  ],
  settings: ["Make it yours", "Your wedding details, preferences and data."],
  notifications: [
    "Needs your attention",
    "Upcoming deadlines and loose ends, calculated from your plan.",
  ],
};
function download(
  name: string,
  content: string,
  type = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Empty({
  icon: Icon = Leaf,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal">
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function Botanical() {
  return (
    <svg
      className="botanical"
      viewBox="0 0 180 220"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M80 220C70 140 130 76 116 7M84 155C39 133 20 107 22 63M105 110c38-22 53-41 56-70M81 189c33-12 56-23 66-45"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      {[
        [95, 72, -32],
        [112, 34, 20],
        [70, 143, -50],
        [35, 99, -40],
        [139, 79, 35],
        [111, 172, 50],
      ].map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="8"
          ry="25"
          transform={`rotate(${r} ${x} ${y})`}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

type FormSpec = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
};
const opts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));
const defaults: Record<
  Exclude<Collection, "documents">,
  Record<string, unknown>
> = {
  tasks: {
    title: "",
    due: "",
    category: "Planning",
    owner: "Together",
    priority: "medium",
    done: false,
    notes: "",
  },
  guests: {
    name: "",
    email: "",
    group: "Family",
    household: "",
    rsvp: "pending",
    meal: "",
    dietary: "",
    table: "",
    notes: "",
  },
  expenses: {
    name: "",
    category: "Venue",
    estimate: 0,
    actual: null,
    paid: 0,
    due: "",
    vendor: "",
    notes: "",
  },
  vendors: {
    name: "",
    category: "Venue",
    status: "researching",
    email: "",
    phone: "",
    website: "",
    notes: "",
  },
  tables: { name: "", capacity: 8 },
  events: { title: "", date: "", time: "", location: "", owner: "", notes: "" },
};
const itemNames = {
  tasks: "task",
  guests: "guest",
  expenses: "expense",
  vendors: "supplier",
  tables: "table",
  events: "event",
  documents: "document",
};

export default function Planner() {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean).pop();
  const page: Page = (
    [
      "tasks",
      "guests",
      "budget",
      "vendors",
      "seating",
      "timeline",
      "documents",
      "settings",
      "notifications",
    ].includes(segment || "")
      ? segment
      : "overview"
  ) as Page;
  const [state, setState] = useState<PlannerState>(emptyState),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(true),
    [unauthorized, setUnauthorized] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [demo, setDemo] = useState(false),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState("");
  const [editor, setEditor] = useState<{
      collection: Exclude<Collection, "documents">;
      item?: Item;
    } | null>(null),
    [showImport, setShowImport] = useState(false),
    [showUpload, setShowUpload] = useState(false),
    [showSetup, setShowSetup] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const locked = useRef(false);
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    setQuery("");
    setFilter("all");
    setMobile(false);
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/plan", { cache: "no-store" });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = (await res.json()) as {
        error?: string;
        state: unknown;
        revision: number;
      };
      if (!res.ok) throw Error(data.error || "Could not load your planner.");
      setState(stateSchema.parse(data.state));
      setRevision(data.revision);
      setUnauthorized(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your planner.");
    } finally {
      setLoading(false);
    }
  }
  async function commit(next: PlannerState, message = "Saved to your planner") {
    if (locked.current) {
      setToast("A save is already in progress. Please try again in a moment.");
      return false;
    }
    const parsed = stateSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return false;
    }
    if (demo) {
      setState(parsed.data);
      setToast("Updated this sample · not saved");
      return true;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: parsed.data, revision }),
      });
      const data = (await res.json()) as { error?: string; revision: number };
      if (!res.ok)
        throw Error(data.error || "Unable to save. Please try again.");
      setState(parsed.data);
      setRevision(data.revision);
      setToast(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      setToast(e instanceof Error ? e.message : "Unable to save.");
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function patch<K extends Collection>(
    collection: K,
    id: string,
    change: Partial<PlannerState[K][number]>,
  ) {
    const next = {
      ...state,
      [collection]: state[collection].map((i) =>
        i.id === id ? { ...i, ...change } : i,
      ),
    } as PlannerState;
    return commit(next);
  }
  async function archive(collection: Collection, id: string, restore = false) {
    const next = structuredClone(state);
    const item = next[collection].find((i) => i.id === id);
    if (!item) return;
    item.archived = !restore;
    if (collection === "guests") (item as Guest).table = "";
    if (collection === "tables" && !restore)
      next.guests.forEach((g) => {
        if (g.table === id) g.table = "";
      });
    if (collection === "vendors" && !restore)
      next.expenses.forEach((e) => {
        if (e.vendor === id) e.vendor = "";
      });
    await commit(
      next,
      restore
        ? "Restored to your planner"
        : "Moved to archive · restore any time in Settings",
    );
  }
  function newItem(collection: Exclude<Collection, "documents">) {
    setEditor({ collection });
  }
  const tasks = active(state.tasks),
    guests = active(state.guests),
    expenses = active(state.expenses),
    vendors = active(state.vendors),
    tables = active(state.tables),
    events = active(state.events),
    documents = active(state.documents);
  const totals = budgetTotals(state.expenses, state.settings.budget);
  const completed = tasks.filter((t) => t.done).length,
    confirmed = guests.filter((g) => g.rsvp === "confirmed"),
    pending = guests.filter((g) => g.rsvp === "pending" || g.rsvp === "maybe");
  const openTasks = tasks
    .filter((t) => !t.done)
    .sort(
      (a, b) =>
        (a.due || "9999").localeCompare(b.due || "9999") ||
        ["high", "medium", "low"].indexOf(a.priority) -
          ["high", "medium", "low"].indexOf(b.priority),
    );
  const payments = expenses
    .filter((e) => e.due && (e.actual ?? e.estimate) > e.paid)
    .sort((a, b) => a.due.localeCompare(b.due));
  const overdue = openTasks.filter((t) => t.due && t.due < today());
  const attention =
    overdue.length +
    payments.filter((e) => dayDistance(e.due) <= 30).length +
    (state.settings.rsvpDeadline && state.settings.rsvpDeadline < today()
      ? pending.length
      : 0);
  const owners = [
    "Together",
    state.settings.partner1,
    state.settings.partner2,
  ].filter(Boolean);
  const initials =
    [state.settings.partner1, state.settings.partner2]
      .filter(Boolean)
      .map((p) => p[0])
      .join(" & ") || "&";
  const matching = (value: string) =>
    value.toLowerCase().includes(query.toLowerCase());
  function actions(collection: Exclude<Collection, "documents">, item: Item) {
    return (
      <div className="row-actions">
        <button
          className="icon-button"
          aria-label={`Edit ${"name" in item ? item.name : "title" in item ? item.title : ""}`}
          onClick={() => setEditor({ collection, item })}
        >
          <Pencil size={15} />
        </button>
        <button
          className="icon-button"
          aria-label={`Archive ${"name" in item ? item.name : "title" in item ? item.title : ""}`}
          disabled={busy}
          onClick={() => archive(collection, item.id)}
        >
          <Archive size={15} />
        </button>
      </div>
    );
  }
  function taskRow(task: Task) {
    return (
      <div
        className={"task-row " + (task.done ? "completed" : "")}
        key={task.id}
      >
        <button
          disabled={busy}
          className={"check-button " + (task.done ? "checked" : "")}
          onClick={() => patch("tasks", task.id, { done: !task.done })}
          aria-label={`${task.done ? "Reopen" : "Complete"} ${task.title}`}
          aria-pressed={task.done}
        >
          {task.done && <Check size={14} />}
        </button>
        <button
          className="task-title"
          onClick={() => setEditor({ collection: "tasks", item: task })}
        >
          <strong>{task.title}</strong>
          <span>
            {task.category} <i>·</i> {task.owner || "Unassigned"}
          </span>
        </button>
        <div className="task-meta">
          {task.due && (
            <span className={task.due < today() && !task.done ? "overdue" : ""}>
              {task.due < today() && !task.done ? "Overdue · " : ""}
              {formatDate(task.due)}
            </span>
          )}
          {task.priority === "high" && !task.done && (
            <Badge tone="rose">High priority</Badge>
          )}
        </div>
        {page === "tasks" && actions("tasks", task)}
      </div>
    );
  }
  function exportGuests() {
    download(
      "wedding-guests.csv",
      makeCsv(
        [
          "Name",
          "Email",
          "Group",
          "Household",
          "RSVP",
          "Meal",
          "Dietary",
          "Table",
          "Notes",
        ],
        guests.map((g) => [
          g.name,
          g.email,
          g.group,
          g.household,
          g.rsvp,
          g.meal,
          g.dietary,
          tables.find((t) => t.id === g.table)?.name || "",
          g.notes,
        ]),
      ),
    );
  }
  function exportBudget() {
    download(
      "wedding-budget.csv",
      makeCsv(
        [
          "Item",
          "Category",
          "Estimated",
          "Agreed",
          "Paid",
          "Balance",
          "Due",
          "Supplier",
          "Notes",
        ],
        expenses.map((e) => [
          e.name,
          e.category,
          e.estimate,
          e.actual ?? "",
          e.paid,
          (e.actual ?? e.estimate) - e.paid,
          e.due,
          vendors.find((v) => v.id === e.vendor)?.name || "",
          e.notes,
        ]),
      ),
    );
  }
  function beginDemo() {
    setDemo(true);
    setState(demoState());
    setError("");
    setUnauthorized(false);
  }
  async function endDemo() {
    setDemo(false);
    await load();
  }
  if (loading)
    return (
      <div className="loading-screen">
        <Heart size={32} />
        <h1>Your day, coming together.</h1>
        <p>Opening your planner…</p>
        <Loader2 className="spin" size={20} />
      </div>
    );
  if (unauthorized)
    return (
      <div className="welcome-screen">
        <div className="brand">
          <Heart size={24} />
          <span>Our Wedding</span>
        </div>
        <p className="eyebrow">LESS ADMIN. MORE ANTICIPATION.</p>
        <h1>
          A little closer
          <br />
          to your big day.
        </h1>
        <p>
          Your plans, people and little details.
          <br />
          Together in one calm, private place.
        </p>
        <a
          className="button primary"
          target="_top"
          href="/signin-with-chatgpt?return_to=/"
        >
          Open your private planner <ArrowRight size={17} />
        </a>
        <button className="text-button" onClick={beginDemo}>
          Explore a sample wedding <ArrowUpRight size={15} />
        </button>
        <small>
          <ShieldCheck size={15} /> Sign in with ChatGPT. Your plan is saved to
          your account.
        </small>
        <Botanical />
      </div>
    );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar desktop-sidebar">
        <Sidebar />
      </aside>
      {mobile && (
        <Modal
          title="Your planner"
          description="Choose where to go next."
          onClose={() => setMobile(false)}
        >
          <Sidebar />
        </Modal>
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Your wedding planner</span>
            <ChevronRight size={13} />
            <strong>
              {nav.find((n) => n.id === page)?.name ||
                (page === "settings" ? "Settings" : "Attention")}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="save-status">
              <span className={busy ? "saving-dot" : "saved-dot"} />
              {demo
                ? "Sample wedding"
                : busy
                  ? "Saving…"
                  : error
                    ? "Check connection"
                    : revision === 0
                      ? "Ready to plan"
                      : "Saved to your account"}
            </span>
            <Link
              className="icon-button notification-link"
              href={urls.notifications}
              aria-label={`Needs attention${attention ? ", " + attention + " items" : ""}`}
            >
              <Bell size={18} />
              {attention > 0 && <b />}
            </Link>
            <Link
              href={urls.settings}
              className="avatar"
              aria-label="Wedding settings"
            >
              {state.settings.partner1?.[0] || "W"}
            </Link>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              Sample wedding · explore freely; these changes aren’t saved.
            </span>
            <button onClick={endDemo}>
              Open my planner <ArrowRight size={14} />
            </button>
          </div>
        )}
        <main id="main" tabIndex={-1}>
          {error && (
            <div role="alert" className="error-banner">
              <AlertCircle size={19} />
              <span>{error} Your last saved plan is safe.</span>
              <button onClick={load} disabled={busy}>
                Reload latest
              </button>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {page === "overview"
                  ? "THE JOURNEY TO “I DO”"
                  : "OUR WEDDING / " +
                    (
                      nav.find((n) => n.id === page)?.name || page
                    ).toUpperCase()}
              </p>
              <h1>{titles[page][0]}</h1>
              <p>{titles[page][1]}</p>
            </div>
            <div className="heading-actions">
              {page === "overview" && (
                <>
                  {!demo && (
                    <button className="button secondary" onClick={beginDemo}>
                      View sample
                    </button>
                  )}
                  <button
                    className="button primary"
                    onClick={() => newItem("tasks")}
                  >
                    <Plus size={17} /> Add a task
                  </button>
                </>
              )}
              {page === "tasks" && (
                <>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      const names = new Set(state.tasks.map((t) => t.title));
                      commit(
                        {
                          ...state,
                          tasks: [
                            ...state.tasks,
                            ...checklist(state.settings.date).filter(
                              (t) => !names.has(t.title),
                            ),
                          ],
                        },
                        "Added suggested tasks · edit or archive anything you don’t need",
                      );
                    }}
                  >
                    Use starter checklist
                  </button>
                  <button
                    className="button primary"
                    onClick={() => newItem("tasks")}
                  >
                    <Plus size={17} /> Add task
                  </button>
                </>
              )}
              {page === "guests" && (
                <>
                  <button
                    className="button secondary"
                    onClick={() => setShowImport(true)}
                  >
                    <Upload size={16} /> Import
                  </button>
                  <button
                    className="button primary"
                    onClick={() => newItem("guests")}
                  >
                    <Plus size={17} /> Add guest
                  </button>
                </>
              )}
              {page === "budget" && (
                <>
                  <button
                    className="button secondary"
                    onClick={() => setShowSetup(true)}
                  >
                    Set budget
                  </button>
                  <button
                    className="button primary"
                    onClick={() => newItem("expenses")}
                  >
                    <Plus size={17} /> Add expense
                  </button>
                </>
              )}
              {page === "vendors" && (
                <button
                  className="button primary"
                  onClick={() => newItem("vendors")}
                >
                  <Plus size={17} /> Add supplier
                </button>
              )}
              {page === "seating" && (
                <button
                  className="button primary"
                  onClick={() => newItem("tables")}
                >
                  <Plus size={17} /> Add table
                </button>
              )}
              {page === "timeline" && (
                <button
                  className="button primary"
                  onClick={() => newItem("events")}
                >
                  <Plus size={17} /> Add event
                </button>
              )}
              {page === "documents" && (
                <button
                  className="button primary"
                  onClick={() => setShowUpload(true)}
                >
                  <Upload size={17} /> Upload document
                </button>
              )}
            </div>
          </div>
          {page === "overview" && (
            <>
              {!state.settings.date && (
                <div className="setup-banner">
                  <div>
                    <span className="eyebrow">LET’S MAKE THIS YOURS</span>
                    <h3>Every good plan starts with your day.</h3>
                    <p>
                      Add your names, date and budget. You can change them any
                      time.
                    </p>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => setShowSetup(true)}
                  >
                    Set up your wedding <ArrowRight size={16} />
                  </button>
                </div>
              )}
              <section className="stats-grid">
                <Stat
                  label="Checklist"
                  value={`${completed} / ${tasks.length}`}
                  detail="little things taken care of"
                  icon={CheckSquare2}
                  href={urls.tasks}
                  progress={tasks.length ? (completed / tasks.length) * 100 : 0}
                />
                <Stat
                  label="Guest replies"
                  value={String(confirmed.length)}
                  detail={`${pending.length} awaiting a reply`}
                  icon={Users}
                  href={urls.guests}
                  progress={
                    guests.length ? (confirmed.length / guests.length) * 100 : 0
                  }
                />
                <Stat
                  label="Budget remaining"
                  value={currency(totals.remaining)}
                  detail={`${currency(totals.forecast)} forecast of ${currency(state.settings.budget)}`}
                  icon={Wallet}
                  href={urls.budget}
                  negative={totals.remaining < 0}
                />
                <Stat
                  label={
                    state.settings.date && dayDistance(state.settings.date) < 0
                      ? "Since your wedding"
                      : "Until your wedding"
                  }
                  value={
                    state.settings.date
                      ? String(Math.abs(dayDistance(state.settings.date)))
                      : "—"
                  }
                  detail={
                    state.settings.date
                      ? "days · " + formatDate(state.settings.date)
                      : "Add your date to start the countdown"
                  }
                  icon={CalendarDays}
                  href={urls.settings}
                />
              </section>
              <div className="overview-columns">
                <div className="overview-main">
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">A LITTLE FOCUS</p>
                        <h2>Next on your list</h2>
                      </div>
                      <Link className="text-link" href={urls.tasks}>
                        View checklist <ArrowRight size={15} />
                      </Link>
                    </div>
                    {openTasks.length ? (
                      <div>{openTasks.slice(0, 4).map(taskRow)}</div>
                    ) : (
                      <Empty
                        icon={CheckSquare2}
                        title={
                          tasks.length
                            ? "A lovely moment to pause."
                            : "Small steps. A beautiful day."
                        }
                        description={
                          tasks.length
                            ? "You’ve completed every task on your list."
                            : "Start with a few essentials, or add your own first task."
                        }
                        action={
                          <button
                            className="button secondary"
                            onClick={() =>
                              tasks.length
                                ? newItem("tasks")
                                : commit({
                                    ...state,
                                    tasks: checklist(state.settings.date),
                                  })
                            }
                          >
                            {tasks.length
                              ? "Add another task"
                              : "Add a starter checklist"}{" "}
                            <Plus size={15} />
                          </button>
                        }
                      />
                    )}
                    <div className="panel-foot">
                      <Leaf size={15} />
                      <span>
                        Your wedding, your pace. Keep only the tasks that matter
                        to you.
                      </span>
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">NO SURPRISES</p>
                        <h2>Payments on the horizon</h2>
                      </div>
                      <Link className="text-link" href={urls.budget}>
                        View budget <ArrowRight size={15} />
                      </Link>
                    </div>
                    {payments.length ? (
                      payments.slice(0, 3).map((e) => (
                        <button
                          className="payment-row"
                          key={e.id}
                          onClick={() =>
                            setEditor({ collection: "expenses", item: e })
                          }
                        >
                          <span className="payment-icon">
                            <Wallet size={18} />
                          </span>
                          <span>
                            <strong>{e.name}</strong>
                            <small className={e.due < today() ? "overdue" : ""}>
                              {e.due < today() ? "Overdue · " : ""}
                              {formatDate(e.due)}
                            </small>
                          </span>
                          <b>{currency((e.actual ?? e.estimate) - e.paid)}</b>
                          <ChevronRight size={15} />
                        </button>
                      ))
                    ) : (
                      <div className="quiet-empty">
                        <CheckCheck size={20} />
                        <div>
                          <strong>No payment dates on the horizon.</strong>
                          <p>
                            Add expenses and due dates to see your next balances
                            here.
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
                <div className="overview-side">
                  <div className="date-card">
                    <Botanical />
                    <p className="eyebrow">THE BEST IS YET TO COME</p>
                    <div className="monogram">{initials}</div>
                    <h2>
                      {state.settings.partner1 && state.settings.partner2
                        ? state.settings.partner1 +
                          " & " +
                          state.settings.partner2
                        : state.settings.name}
                    </h2>
                    <div className="fine-line" />
                    <p>
                      {state.settings.date
                        ? formatDate(state.settings.date)
                        : "A date to look forward to"}
                    </p>
                    <small>
                      <MapPin size={13} />
                      {state.settings.venue || "Somewhere wonderful"}
                    </small>
                    <button
                      className="text-link"
                      onClick={() => setShowSetup(true)}
                    >
                      Edit wedding details <Pencil size={13} />
                    </button>
                  </div>
                  <section className="panel compact">
                    <p className="eyebrow">YOUR PLANNING CORNER</p>
                    <h3>Keep everything close.</h3>
                    <Link className="shortcut" href={urls.guests}>
                      <Users size={18} />
                      <span>Add your favourite people</span>
                      <ArrowUpRight size={16} />
                    </Link>
                    <Link className="shortcut" href={urls.vendors}>
                      <Store size={18} />
                      <span>Build your supplier team</span>
                      <ArrowUpRight size={16} />
                    </Link>
                    <Link className="shortcut" href={urls.timeline}>
                      <CalendarDays size={18} />
                      <span>Picture the wedding day</span>
                      <ArrowUpRight size={16} />
                    </Link>
                  </section>
                </div>
              </div>
            </>
          )}
          {page === "tasks" && (
            <>
              <div className="summary-line">
                <span>
                  <strong>{completed}</strong> of {tasks.length} tasks complete
                </span>
                <Progress
                  value={tasks.length ? (completed / tasks.length) * 100 : 0}
                  label="Checklist complete"
                />
                <span>
                  {overdue.length
                    ? overdue.length + " overdue"
                    : "One step at a time"}
                </span>
              </div>
              <Toolbar
                placeholder="Search your checklist…"
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                options={[
                  ["all", "All tasks"],
                  ["open", "To do"],
                  ["done", "Completed"],
                  ["overdue", "Overdue"],
                ]}
              />
              <section className="panel">
                {tasks
                  .filter(
                    (t) =>
                      matching(t.title + " " + t.category + " " + t.owner) &&
                      (filter === "all" ||
                        (filter === "open" && !t.done) ||
                        (filter === "done" && t.done) ||
                        (filter === "overdue" &&
                          !t.done &&
                          !!t.due &&
                          t.due < today())),
                  )
                  .sort(
                    (a, b) =>
                      Number(a.done) - Number(b.done) ||
                      (a.due || "9999").localeCompare(b.due || "9999"),
                  )
                  .map(taskRow)}
                {!tasks.some(
                  (t) =>
                    matching(t.title + " " + t.category + " " + t.owner) &&
                    (filter === "all" ||
                      (filter === "open" && !t.done) ||
                      (filter === "done" && t.done) ||
                      (filter === "overdue" &&
                        !t.done &&
                        !!t.due &&
                        t.due < today())),
                ) && (
                  <Empty
                    icon={CheckSquare2}
                    title={
                      tasks.length
                        ? "Nothing in this view"
                        : "Start with one little thing"
                    }
                    description={
                      tasks.length
                        ? "Try a different search or filter."
                        : "Add a task or use the editable starter checklist."
                    }
                  />
                )}
              </section>
            </>
          )}
          {page === "guests" && (
            <>
              <section className="stats-grid three">
                <Stat
                  label="On your list"
                  value={String(guests.length)}
                  detail={
                    state.settings.guestTarget
                      ? `of ${state.settings.guestTarget} planned guests`
                      : "One row per person, including named plus-ones"
                  }
                  icon={Users}
                />
                <Stat
                  label="Joining you"
                  value={String(confirmed.length)}
                  detail={`${guests.filter((g) => g.rsvp === "declined").length} declined`}
                  icon={Check}
                />
                <Stat
                  label="Waiting to hear"
                  value={String(pending.length)}
                  detail={
                    state.settings.rsvpDeadline
                      ? "RSVP by " + formatDate(state.settings.rsvpDeadline)
                      : "Set an RSVP deadline in Settings"
                  }
                  icon={Clock3}
                />
              </section>
              <Toolbar
                placeholder="Search names, households or dietary notes…"
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                options={[
                  ["all", "All guests"],
                  ["confirmed", "Confirmed"],
                  ["pending", "Pending"],
                  ["maybe", "Maybe"],
                  ["declined", "Declined"],
                ]}
                extra={
                  <button className="button secondary" onClick={exportGuests}>
                    <Download size={15} /> Export CSV
                  </button>
                }
              />
              <div className="panel table-wrap">
                <table>
                  <caption className="sr-only">Wedding guest list</caption>
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>RSVP</th>
                      <th>Meal & dietary notes</th>
                      <th>Household / group</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests
                      .filter(
                        (g) =>
                          matching(
                            g.name +
                              " " +
                              g.email +
                              " " +
                              g.household +
                              " " +
                              g.dietary,
                          ) &&
                          (filter === "all" || g.rsvp === filter),
                      )
                      .map((g) => (
                        <tr key={g.id}>
                          <td>
                            <button
                              className="name-link"
                              onClick={() =>
                                setEditor({ collection: "guests", item: g })
                              }
                            >
                              {g.name}
                            </button>
                            <small>{g.email || "No email added"}</small>
                          </td>
                          <td data-label="RSVP">
                            <select
                              className={"status-select " + g.rsvp}
                              aria-label={`RSVP for ${g.name}`}
                              value={g.rsvp}
                              disabled={busy}
                              onChange={(e) =>
                                patch("guests", g.id, {
                                  rsvp: e.target.value as Guest["rsvp"],
                                  table:
                                    e.target.value === "confirmed"
                                      ? g.table
                                      : "",
                                })
                              }
                            >
                              {[
                                "pending",
                                "confirmed",
                                "maybe",
                                "declined",
                              ].map((v) => (
                                <option key={v} value={v}>
                                  {v[0].toUpperCase() + v.slice(1)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td data-label="Meal & dietary">
                            {g.meal || "—"}
                            {g.dietary && (
                              <small className="dietary-note">
                                {g.dietary}
                              </small>
                            )}
                          </td>
                          <td data-label="Household / group">
                            {g.household || g.group || "—"}
                            {g.household && <small>{g.group}</small>}
                          </td>
                          <td>{actions("guests", g)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!guests.filter(
                  (g) =>
                    matching(
                      g.name +
                        " " +
                        g.email +
                        " " +
                        g.household +
                        " " +
                        g.dietary,
                    ) &&
                    (filter === "all" || g.rsvp === filter),
                ).length && (
                  <Empty
                    icon={Users}
                    title={
                      guests.length
                        ? "No matching guests"
                        : "It starts with your people"
                    }
                    description="Add guests individually or import your existing spreadsheet as a CSV."
                  />
                )}
              </div>
              <p className="helper-text">
                Add each plus-one as a named guest in the same household so
                headcounts, meals and seats stay accurate. RSVPs are recorded
                here manually.
              </p>
            </>
          )}
          {page === "budget" && (
            <>
              <section className="stats-grid">
                <Stat
                  label="Total budget"
                  value={currency(state.settings.budget)}
                  detail="Your spending target"
                  icon={Wallet}
                />
                <Stat
                  label="Forecast cost"
                  value={currency(totals.forecast)}
                  detail="Agreed costs, or estimates if not agreed"
                  icon={Store}
                />
                <Stat
                  label="Paid so far"
                  value={currency(totals.paid)}
                  detail={`${currency(totals.outstanding)} still to pay`}
                  icon={Check}
                />
                <Stat
                  label={
                    totals.remaining < 0 ? "Over budget" : "Budget remaining"
                  }
                  value={currency(Math.abs(totals.remaining))}
                  detail={
                    totals.remaining < 0
                      ? "Your forecast is above your target"
                      : "After all forecast costs"
                  }
                  icon={Wallet}
                  negative={totals.remaining < 0}
                />
              </section>
              <Toolbar
                placeholder="Find an expense…"
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                options={[
                  ["all", "All expenses"],
                  ["unpaid", "Balance remaining"],
                  ["paid", "Fully paid"],
                  ["overdue", "Overdue payments"],
                ]}
                extra={
                  <button className="button secondary" onClick={exportBudget}>
                    <Download size={15} /> Export CSV
                  </button>
                }
              />
              <div className="panel table-wrap">
                <table>
                  <caption className="sr-only">
                    Budget and payment tracking
                  </caption>
                  <thead>
                    <tr>
                      <th>Expense</th>
                      <th>Estimated</th>
                      <th>Agreed</th>
                      <th>Paid</th>
                      <th>Balance / due</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses
                      .filter(
                        (e) =>
                          matching(e.name + " " + e.category) &&
                          (filter === "all" ||
                            (filter === "unpaid" &&
                              e.paid < (e.actual ?? e.estimate)) ||
                            (filter === "paid" &&
                              e.paid >= (e.actual ?? e.estimate)) ||
                            (filter === "overdue" &&
                              !!e.due &&
                              e.due < today() &&
                              e.paid < (e.actual ?? e.estimate))),
                      )
                      .map((e) => (
                        <tr key={e.id}>
                          <td>
                            <button
                              className="name-link"
                              onClick={() =>
                                setEditor({ collection: "expenses", item: e })
                              }
                            >
                              {e.name}
                            </button>
                            <small>
                              {e.category}
                              {e.vendor
                                ? " · " +
                                  vendors.find((v) => v.id === e.vendor)?.name
                                : ""}
                            </small>
                          </td>
                          <td data-label="Estimated">{currency(e.estimate)}</td>
                          <td data-label="Agreed">
                            {e.actual === null ? (
                              <span className="muted">Not agreed</span>
                            ) : (
                              currency(e.actual)
                            )}
                          </td>
                          <td data-label="Paid">{currency(e.paid)}</td>
                          <td data-label="Balance / due">
                            <strong>
                              {currency((e.actual ?? e.estimate) - e.paid)}
                            </strong>
                            <small
                              className={
                                e.due &&
                                e.due < today() &&
                                e.paid < (e.actual ?? e.estimate)
                                  ? "overdue"
                                  : ""
                              }
                            >
                              {e.paid >= (e.actual ?? e.estimate)
                                ? "Paid in full"
                                : e.due
                                  ? formatDate(e.due)
                                  : "No due date"}
                            </small>
                          </td>
                          <td>{actions("expenses", e)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!expenses.length && (
                  <Empty
                    icon={Wallet}
                    title="A plan for every pound"
                    description="Add your first expense, then record the agreed cost, deposit or payments, and balance due date."
                  />
                )}
              </div>
              <p className="helper-text">
                Open an expense to record a payment in “Total paid so far”. This
                is a tracker; it doesn’t make payments or send automatic
                reminders.
              </p>
            </>
          )}
          {page === "vendors" && (
            <>
              <Toolbar
                placeholder="Find a supplier…"
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                options={[
                  ["all", "All suppliers"],
                  ["researching", "Researching"],
                  ["contacted", "Contacted"],
                  ["shortlisted", "Shortlisted"],
                  ["booked", "Booked"],
                ]}
              />
              <div className="cards-grid">
                {vendors
                  .filter(
                    (v) =>
                      matching(v.name + " " + v.category) &&
                      (filter === "all" || v.status === filter),
                  )
                  .map((v) => (
                    <section className="panel supplier-card" key={v.id}>
                      <div className="card-top">
                        <span className="supplier-icon">
                          <Store size={21} />
                        </span>
                        <Badge
                          tone={v.status === "booked" ? "green" : "neutral"}
                        >
                          {v.status}
                        </Badge>
                      </div>
                      <p className="eyebrow">{v.category}</p>
                      <h2>{v.name}</h2>
                      {v.email && (
                        <a href={"mailto:" + v.email}>
                          <Mail size={14} />
                          {v.email}
                        </a>
                      )}
                      {v.phone && <a href={"tel:" + v.phone}>{v.phone}</a>}
                      {v.website && (
                        <a href={v.website} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} />
                          Visit website
                        </a>
                      )}
                      {v.notes && <p className="supplier-notes">{v.notes}</p>}
                      <div className="card-bottom">
                        <span>
                          {expenses.filter((e) => e.vendor === v.id).length}{" "}
                          linked expenses
                        </span>
                        {actions("vendors", v)}
                      </div>
                    </section>
                  ))}
              </div>
              {!vendors.filter(
                (v) =>
                  matching(v.name + " " + v.category) &&
                  (filter === "all" || v.status === filter),
              ).length && (
                <section className="panel">
                  <Empty
                    icon={Store}
                    title={
                      vendors.length
                        ? "No matching suppliers"
                        : "Good people make a great day"
                    }
                    description="Keep a shortlist, contact details and booking notes. Link costs from your budget."
                  />
                </section>
              )}
            </>
          )}
          {page === "seating" && (
            <>
              <div className="summary-line">
                <span>
                  <strong>{confirmed.filter((g) => g.table).length}</strong> of{" "}
                  {confirmed.length} confirmed guests seated
                </span>
                <span>
                  {tables.reduce((n, t) => n + t.capacity, 0)} seats available
                  in total
                </span>
                <button
                  className="button secondary"
                  onClick={() =>
                    download(
                      "wedding-seating.csv",
                      makeCsv(
                        ["Table", "Guest", "Meal", "Dietary"],
                        confirmed.map((g) => [
                          tables.find((t) => t.id === g.table)?.name ||
                            "Unassigned",
                          g.name,
                          g.meal,
                          g.dietary,
                        ]),
                      ),
                    )
                  }
                >
                  <Download size={15} /> Export seating
                </button>
              </div>
              <div className="seating-layout">
                <section className="panel seating-people">
                  <div className="panel-heading">
                    <h2>Confirmed guests</h2>
                    <Badge>{confirmed.length}</Badge>
                  </div>
                  {confirmed.map((g) => (
                    <div className="seat-person" key={g.id}>
                      <div>
                        <strong>{g.name}</strong>
                        {g.dietary && <small>{g.dietary}</small>}
                      </div>
                      <select
                        aria-label={`Table for ${g.name}`}
                        value={g.table}
                        disabled={busy}
                        onChange={(e) =>
                          patch("guests", g.id, { table: e.target.value })
                        }
                      >
                        <option value="">Unassigned</option>
                        {tables.map((t) => (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={
                              g.table !== t.id &&
                              confirmed.filter((x) => x.table === t.id)
                                .length >= t.capacity
                            }
                          >
                            {t.name} (
                            {confirmed.filter((x) => x.table === t.id).length}/
                            {t.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {!confirmed.length && (
                    <Empty
                      icon={Users}
                      title="Waiting for your first yes"
                      description="Confirm a guest’s RSVP to start assigning seats."
                      action={
                        <Link className="button secondary" href={urls.guests}>
                          Open guest list
                        </Link>
                      }
                    />
                  )}
                </section>
                <div className="table-cards">
                  {tables.map((t) => {
                    const seated = confirmed.filter((g) => g.table === t.id);
                    return (
                      <section className="panel seating-card" key={t.id}>
                        <div className="card-top">
                          <h2>{t.name}</h2>
                          {actions("tables", t)}
                        </div>
                        <div className="table-symbol">
                          <Armchair size={23} />
                          <strong>
                            {seated.length}
                            <small> / {t.capacity}</small>
                          </strong>
                        </div>
                        <Progress
                          value={(seated.length / t.capacity) * 100}
                          label={`${t.name} capacity`}
                        />
                        <p className="helper-text">
                          {t.capacity - seated.length} seats remaining
                        </p>
                        <ul>
                          {seated.map((g) => (
                            <li key={g.id}>
                              {g.name}
                              {g.meal && <small>{g.meal}</small>}
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                  {!tables.length && (
                    <section className="panel">
                      <Empty
                        icon={Armchair}
                        title="Set the table"
                        description="Add tables with their capacities. The guest list prevents overbooking."
                      />
                    </section>
                  )}
                </div>
              </div>
            </>
          )}
          {page === "timeline" && (
            <>
              <div className="toolbar">
                <span className="helper-text">
                  For the wedding day, rehearsal and everything around it.
                </span>
                <button
                  className="button secondary"
                  onClick={() =>
                    download(
                      "wedding-timeline.csv",
                      makeCsv(
                        [
                          "Date",
                          "Time",
                          "Event",
                          "Location",
                          "Responsible",
                          "Notes",
                        ],
                        [...events]
                          .sort((a, b) =>
                            (a.date + a.time).localeCompare(b.date + b.time),
                          )
                          .map((e) => [
                            e.date,
                            e.time,
                            e.title,
                            e.location,
                            e.owner,
                            e.notes,
                          ]),
                      ),
                    )
                  }
                >
                  <Download size={15} /> Export timeline
                </button>
              </div>
              <section className="panel timeline-panel">
                {[...events]
                  .sort((a, b) =>
                    (a.date + a.time).localeCompare(b.date + b.time),
                  )
                  .map((e) => (
                    <div className="timeline-event" key={e.id}>
                      <div className="event-time">
                        <strong>{e.time || "TBC"}</strong>
                        <small>{formatDate(e.date)}</small>
                      </div>
                      <div className="timeline-dot" />
                      <div className="event-details">
                        <h2>{e.title}</h2>
                        <p>
                          {[e.location, e.owner].filter(Boolean).join(" · ")}
                        </p>
                        {e.notes && <p className="muted">{e.notes}</p>}
                      </div>
                      {actions("events", e)}
                    </div>
                  ))}
                {!events.length && (
                  <Empty
                    icon={CalendarDays}
                    title="Picture how your day will flow"
                    description="Add ceremony times, supplier arrivals and the moments you don’t want to rush."
                    action={
                      <button
                        className="button secondary"
                        onClick={() => newItem("events")}
                      >
                        Add your first event <Plus size={15} />
                      </button>
                    }
                  />
                )}
              </section>
            </>
          )}
          {page === "documents" && (
            <>
              <Toolbar
                placeholder="Search documents…"
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                options={opts([
                  "all",
                  ...Array.from(new Set(documents.map((d) => d.folder))),
                ]).map((x) => [
                  x.value,
                  x.value === "all" ? "All folders" : x.label,
                ])}
              />
              <section className="panel">
                {documents
                  .filter(
                    (d) =>
                      matching(d.name) &&
                      (filter === "all" || d.folder === filter),
                  )
                  .map((d) => (
                    <div className="document-row" key={d.id}>
                      <span className="payment-icon">
                        <Files size={20} />
                      </span>
                      <div>
                        <strong>{d.name}</strong>
                        <small>
                          {d.folder} · {(d.size / 1024).toFixed(0)} KB
                        </small>
                      </div>
                      <a
                        className="icon-button"
                        href={"/api/documents?id=" + encodeURIComponent(d.id)}
                        aria-label={`Download ${d.name}`}
                      >
                        <Download size={18} />
                      </a>
                      <button
                        className="icon-button"
                        disabled={busy}
                        onClick={() => archive("documents", d.id)}
                        aria-label={`Archive ${d.name}`}
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  ))}
                {!documents.filter(
                  (d) =>
                    matching(d.name) &&
                    (filter === "all" || d.folder === filter),
                ).length && (
                  <Empty
                    icon={Files}
                    title={
                      documents.length
                        ? "No matching documents"
                        : "A home for the important details"
                    }
                    description="Upload contracts, quotes and receipts. Files are stored privately with your planner, up to 10 MB each."
                  />
                )}
              </section>
            </>
          )}
          {page === "settings" && (
            <div className="settings-columns">
              <section className="panel compact">
                <p className="eyebrow">YOUR DAY</p>
                <h2>Wedding details</h2>
                <dl className="details-list">
                  <dt>Wedding name</dt>
                  <dd>{state.settings.name}</dd>
                  <dt>Date</dt>
                  <dd>{formatDate(state.settings.date)}</dd>
                  <dt>Venue</dt>
                  <dd>{state.settings.venue || "To be decided"}</dd>
                  <dt>Budget</dt>
                  <dd>{currency(state.settings.budget)}</dd>
                  <dt>Guest target</dt>
                  <dd>{state.settings.guestTarget || "Not set"}</dd>
                  <dt>RSVP deadline</dt>
                  <dd>{formatDate(state.settings.rsvpDeadline)}</dd>
                </dl>
                <button
                  className="button primary"
                  onClick={() => setShowSetup(true)}
                >
                  <Pencil size={15} /> Edit details
                </button>
              </section>
              <div>
                <section className="panel compact">
                  <ShieldCheck size={23} />
                  <h2>Your plan, safely kept</h2>
                  <p>
                    Saved privately to your signed-in account, across devices.
                    Task owners help you divide the work; they don’t grant
                    account access.
                  </p>
                  <p className="helper-text">
                    Shared editing and guest-facing RSVPs aren’t enabled yet.
                    Export a guest list, seating plan or timeline to share
                    exactly what’s needed.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() =>
                      download(
                        "wedding-plan-backup.json",
                        JSON.stringify(state, null, 2),
                        "application/json",
                      )
                    }
                  >
                    <Download size={15} /> Export plan backup
                  </button>
                  <p className="helper-text">
                    The backup includes your planning data and file names, not
                    file contents. Download documents individually.
                  </p>
                </section>
                <section className="panel compact archive-section">
                  <p className="eyebrow">NOT GONE, JUST TUCKED AWAY</p>
                  <h2>Archived items</h2>
                  {(
                    [
                      "tasks",
                      "guests",
                      "expenses",
                      "vendors",
                      "tables",
                      "events",
                      "documents",
                    ] as Collection[]
                  ).flatMap((c) =>
                    state[c]
                      .filter((i) => i.archived)
                      .map((i) => (
                        <div className="archive-row" key={i.id}>
                          <div>
                            <strong>{"title" in i ? i.title : i.name}</strong>
                            <small>{itemNames[c]}</small>
                          </div>
                          <button
                            className="button secondary small"
                            disabled={busy}
                            onClick={() => archive(c, i.id, true)}
                          >
                            <RotateCcw size={14} /> Restore
                          </button>
                        </div>
                      )),
                  )}
                  {!(
                    [
                      "tasks",
                      "guests",
                      "expenses",
                      "vendors",
                      "tables",
                      "events",
                      "documents",
                    ] as Collection[]
                  ).some((c) => state[c].some((i) => i.archived)) && (
                    <p className="muted">
                      Nothing archived. Items you remove can be restored here.
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}
          {page === "notifications" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Planning reminders</h2>
                <Badge>{attention} needing attention</Badge>
              </div>
              {overdue.map(taskRow)}
              {payments
                .filter((e) => dayDistance(e.due) <= 30)
                .map((e) => (
                  <button
                    className="payment-row"
                    key={e.id}
                    onClick={() =>
                      setEditor({ collection: "expenses", item: e })
                    }
                  >
                    <Wallet size={19} />
                    <span>
                      <strong>{e.name}</strong>
                      <small>
                        {e.due < today() ? "Overdue · " : ""}
                        {formatDate(e.due)}
                      </small>
                    </span>
                    <b>{currency((e.actual ?? e.estimate) - e.paid)}</b>
                    <ChevronRight size={16} />
                  </button>
                ))}
              {state.settings.rsvpDeadline &&
                state.settings.rsvpDeadline < today() &&
                pending.length > 0 && (
                  <Link className="payment-row" href={urls.guests}>
                    <Users size={20} />
                    <span>
                      <strong>{pending.length} guests still to reply</strong>
                      <small>Your RSVP deadline has passed.</small>
                    </span>
                    <ArrowRight size={17} />
                  </Link>
                )}
              {attention === 0 && (
                <Empty
                  icon={CheckCheck}
                  title="A little breathing room"
                  description="No overdue tasks, payments due in the next 30 days or late RSVPs. Your reminders will appear here as you plan."
                />
              )}
              <div className="panel-foot">
                <Clock3 size={15} />
                Reminders appear here when you open the app. No emails or push
                notifications are sent.
              </div>
            </section>
          )}
          <footer className="page-footer">
            <Heart size={13} />
            <span>A little less planning. A little more looking forward.</span>
            <span>Made for your day.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {editor && (
        <Editor
          collection={editor.collection}
          item={editor.item}
          state={state}
          owners={owners}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={async (item) => {
            const next = {
              ...state,
              [editor.collection]: editor.item
                ? state[editor.collection].map((i) =>
                    i.id === item.id ? item : i,
                  )
                : [...state[editor.collection], item],
            } as PlannerState;
            if (
              editor.collection === "guests" &&
              (item as Guest).rsvp !== "confirmed"
            )
              (item as Guest).table = "";
            if (await commit(next)) setEditor(null);
          }}
        />
      )}
      {showSetup && (
        <SettingsForm
          state={state}
          busy={busy}
          onClose={() => setShowSetup(false)}
          onSave={async (settings) => {
            if (await commit({ ...state, settings })) setShowSetup(false);
          }}
        />
      )}
      {showImport && (
        <ImportGuests
          state={state}
          busy={busy}
          onClose={() => setShowImport(false)}
          onSave={async (list) => {
            if (
              await commit(
                { ...state, guests: [...state.guests, ...list] },
                `Imported ${list.length} guests`,
              )
            )
              setShowImport(false);
          }}
        />
      )}
      {showUpload && (
        <UploadDocument
          demo={demo}
          busy={busy}
          onClose={() => setShowUpload(false)}
          onSave={async (doc) => {
            if (
              await commit(
                { ...state, documents: [...state.documents, doc] },
                "Document saved privately",
              )
            )
              setShowUpload(false);
          }}
        />
      )}
    </div>
  );
  function Sidebar() {
    return (
      <>
        <Link href="/" className="brand" onClick={() => setMobile(false)}>
          <Heart size={25} strokeWidth={1.5} />
          <span>
            Our Wedding<small>ALL THE LITTLE DETAILS</small>
          </span>
        </Link>
        <div className="wedding-label">
          <span className="wedding-icon">{initials}</span>
          <div>
            <strong>{state.settings.name}</strong>
            <small>
              {state.settings.date
                ? formatDate(state.settings.date)
                : "Your beautiful beginning"}
            </small>
          </div>
        </div>
        <p className="nav-label">YOUR PLANNING SPACE</p>
        <nav aria-label="Wedding planner">
          {nav.map((n) => (
            <Link
              onClick={() => setMobile(false)}
              href={urls[n.id]}
              key={n.id}
              aria-current={page === n.id ? "page" : undefined}
              className={page === n.id ? "active" : ""}
            >
              <n.icon size={18} strokeWidth={1.6} />
              <span>{n.name}</span>
              {n.id === "tasks" && openTasks.length > 0 && (
                <small>{openTasks.length}</small>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf size={20} />
            <p>
              For the day.
              <br />
              <em>And everything before it.</em>
            </p>
          </div>
          <Link
            href={urls.settings}
            className={
              page === "settings" ? "settings-link active" : "settings-link"
            }
            onClick={() => setMobile(false)}
          >
            <Settings2 size={17} /> Settings & your data
          </Link>
          {!demo && (
            <a
              className="signout"
              href="/signout-with-chatgpt?return_to=/"
              target="_top"
            >
              <LogOut size={15} /> Sign out
            </a>
          )}
        </div>
      </>
    );
  }
}
function Stat({
  label,
  value,
  detail,
  icon: Icon,
  href,
  progress,
  negative,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  href?: string;
  progress?: number;
  negative?: boolean;
}) {
  const content = (
    <>
      <div className="stat-label">
        {label}
        <Icon size={17} strokeWidth={1.6} />
      </div>
      <strong className={"stat-value " + (negative ? "overdue" : "")}>
        {value}
      </strong>
      <p>{detail}</p>
      {progress !== undefined && <Progress value={progress} label={label} />}
    </>
  );
  return href ? (
    <Link className="stat-card" href={href}>
      {content}
    </Link>
  ) : (
    <div className="stat-card">{content}</div>
  );
}
function Toolbar({
  query,
  setQuery,
  filter,
  setFilter,
  options,
  placeholder,
  extra,
}: {
  query: string;
  setQuery: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  options: string[][];
  placeholder: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="toolbar">
      <label className="search-field">
        <Search size={17} />
        <input
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <select
        aria-label="Filter results"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        {options.map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
      {extra}
    </div>
  );
}

function Editor({
  collection,
  item,
  state,
  owners,
  busy,
  onClose,
  onSave,
}: {
  collection: Exclude<Collection, "documents">;
  item?: Item;
  state: PlannerState;
  owners: string[];
  busy: boolean;
  onClose: () => void;
  onSave: (item: Item) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(
    item
      ? { ...item }
      : {
          ...defaults[collection],
          id: crypto.randomUUID(),
          archived: false,
          ...(collection === "events" ? { date: state.settings.date } : {}),
        },
  );
  const [error, setError] = useState("");
  const fields: Record<typeof collection, FormSpec[]> = {
    tasks: [
      { name: "title", label: "Task name", required: true },
      { name: "category", label: "Category", options: opts(categories) },
      {
        name: "owner",
        label: "Who’s taking care of it?",
        options: opts(owners),
      },
      { name: "due", label: "Due date", type: "date" },
      {
        name: "priority",
        label: "Priority",
        options: opts(["low", "medium", "high"]),
      },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    guests: [
      { name: "name", label: "Full name", required: true },
      { name: "email", label: "Email", type: "email" },
      {
        name: "group",
        label: "Group",
        hint: "For example: family, friends or colleagues.",
      },
      {
        name: "household",
        label: "Household",
        hint: "Use the same household name for partners and plus-ones.",
      },
      {
        name: "rsvp",
        label: "RSVP",
        options: opts(["pending", "confirmed", "maybe", "declined"]),
      },
      { name: "meal", label: "Meal choice" },
      {
        name: "dietary",
        label: "Dietary requirements & allergies",
        type: "textarea",
      },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    expenses: [
      { name: "name", label: "Expense name", required: true },
      { name: "category", label: "Category", options: opts(categories) },
      {
        name: "estimate",
        label: "Estimated cost (£)",
        type: "number",
        required: true,
      },
      {
        name: "actual",
        label: "Agreed cost (£)",
        type: "number",
        hint: "Leave blank until you have an agreed total. Zero means free.",
      },
      {
        name: "paid",
        label: "Total paid so far (£)",
        type: "number",
        required: true,
        hint: "Include your deposit and any later payments.",
      },
      { name: "due", label: "Balance due date", type: "date" },
      {
        name: "vendor",
        label: "Supplier",
        options: [
          { value: "", label: "Not linked" },
          ...active(state.vendors).map((v) => ({ value: v.id, label: v.name })),
        ],
      },
      { name: "notes", label: "Notes / payment history", type: "textarea" },
    ],
    vendors: [
      { name: "name", label: "Supplier name", required: true },
      { name: "category", label: "Category", options: opts(categories) },
      {
        name: "status",
        label: "Booking status",
        options: opts(["researching", "contacted", "shortlisted", "booked"]),
      },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
      {
        name: "website",
        label: "Website",
        type: "url",
        hint: "Include https://",
      },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    tables: [
      { name: "name", label: "Table name", required: true },
      {
        name: "capacity",
        label: "Number of seats",
        type: "number",
        required: true,
      },
    ],
    events: [
      { name: "title", label: "Event name", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "time", label: "Time", type: "time" },
      { name: "location", label: "Location" },
      { name: "owner", label: "Who’s responsible?" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  };
  return (
    <Modal
      title={`${item ? "Edit" : "Add"} ${itemNames[collection]}`}
      description={
        collection === "guests"
          ? "One person per entry keeps your guest count and seating accurate."
          : "The little details that keep your day on track."
      }
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const next = {
            ...state,
            [collection]: item
              ? state[collection].map((i) => (i.id === form.id ? form : i))
              : [...state[collection], form],
          } as PlannerState;
          if (collection === "guests" && form.rsvp !== "confirmed") {
            form.table = "";
          }
          const parsed = stateSchema.safeParse(next);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
          }
          await onSave(form as Item);
        }}
      >
        <fieldset disabled={busy} className="form-fields">
          <div className="form-grid">
            {fields[collection].map((f) => (
              <label
                key={f.name}
                className={f.type === "textarea" ? "field full" : "field"}
              >
                <span>
                  {f.label}
                  {f.required ? " *" : ""}
                </span>
                {f.options ? (
                  <select
                    value={String(form[f.name] ?? "")}
                    onChange={(e) =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    maxLength={4000}
                    value={String(form[f.name] ?? "")}
                    onChange={(e) =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    autoFocus={fields[collection][0] === f}
                    type={f.type || "text"}
                    required={f.required}
                    min={
                      f.name === "capacity"
                        ? 1
                        : f.type === "number"
                          ? 0
                          : undefined
                    }
                    max={
                      f.name === "capacity"
                        ? 100
                        : f.type === "number"
                          ? 100000000
                          : undefined
                    }
                    step={
                      f.name === "capacity"
                        ? 1
                        : f.type === "number"
                          ? "0.01"
                          : undefined
                    }
                    maxLength={200}
                    value={String(form[f.name] ?? "")}
                    onInput={(e) => {
                      if (f.type === "date" || f.type === "time")
                        setForm({ ...form, [f.name]: e.currentTarget.value });
                    }}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.name]:
                          f.type === "number"
                            ? e.target.value === "" && f.name === "actual"
                              ? null
                              : e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}{" "}
                {f.hint && <small>{f.hint}</small>}
              </label>
            ))}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              {busy ? (
                <Loader2 className="spin" size={16} />
              ) : (
                <Check size={16} />
              )}{" "}
              {busy ? "Saving…" : "Save " + itemNames[collection]}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
function SettingsForm({
  state,
  busy,
  onClose,
  onSave,
}: {
  state: PlannerState;
  busy: boolean;
  onClose: () => void;
  onSave: (settings: PlannerState["settings"]) => Promise<void>;
}) {
  const [form, setForm] = useState(state.settings),
    [error, setError] = useState("");
  const fields: FormSpec[] = [
    { name: "name", label: "Wedding name", required: true },
    { name: "partner1", label: "Your name" },
    { name: "partner2", label: "Your partner’s name" },
    { name: "date", label: "Wedding date", type: "date" },
    { name: "venue", label: "Venue" },
    {
      name: "budget",
      label: "Total budget (£)",
      type: "number",
      required: true,
    },
    { name: "guestTarget", label: "Planned guest count", type: "number" },
    { name: "rsvpDeadline", label: "RSVP deadline", type: "date" },
  ];
  return (
    <Modal
      title="Your wedding, your way"
      description="Make this space your own. You can change these details any time."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const check = stateSchema.safeParse({ ...state, settings: form });
          if (!check.success) {
            setError(check.error.issues[0].message);
            return;
          }
          await onSave(form);
        }}
      >
        <fieldset disabled={busy} className="form-fields">
          <div className="form-grid">
            {fields.map((f) => (
              <label className="field" key={f.name}>
                <span>{f.label}</span>
                <input
                  type={f.type || "text"}
                  required={f.required}
                  min={f.type === "number" ? 0 : undefined}
                  step={
                    f.name === "budget"
                      ? "0.01"
                      : f.name === "guestTarget"
                        ? 1
                        : undefined
                  }
                  value={form[f.name as keyof typeof form]}
                  onInput={(e) => {
                    if (f.type === "date")
                      setForm({ ...form, [f.name]: e.currentTarget.value });
                  }}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [f.name]:
                        f.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              </label>
            ))}
          </div>
          <p className="helper-text">
            Changing your wedding date won’t move existing task deadlines. You
            stay in control of those dates.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary">
              {busy ? "Saving…" : "Save wedding details"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
function ImportGuests({
  state,
  busy,
  onClose,
  onSave,
}: {
  state: PlannerState;
  busy: boolean;
  onClose: () => void;
  onSave: (guests: Guest[]) => Promise<void>;
}) {
  const [guests, setGuests] = useState<Guest[]>([]),
    [error, setError] = useState(""),
    [skipped, setSkipped] = useState(0);
  return (
    <Modal
      title="Bring your guest list with you"
      description="Choose a CSV file, review the import, then add your guests."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="form-fields">
        <button
          className="text-link"
          onClick={() =>
            download(
              "guest-import-template.csv",
              makeCsv(
                [
                  "Name",
                  "Email",
                  "Group",
                  "Household",
                  "RSVP",
                  "Meal",
                  "Dietary",
                  "Notes",
                ],
                [],
              ),
            )
          }
        >
          <Download size={15} />
          Download a blank template
        </button>
        <label className="upload-zone">
          <Upload size={26} />
          <strong>Select a CSV file</strong>
          <span>Name is required. Other template columns are optional.</span>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Guest CSV file"
            onChange={async (e) => {
              setError("");
              setGuests([]);
              setSkipped(0);
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 2000000)
                  throw Error("Choose a CSV under 2 MB.");
                const list = guestsFromCsv(await file.text());
                const key = (g: Guest) =>
                  g.name.toLowerCase() +
                  "|" +
                  g.email.toLowerCase() +
                  "|" +
                  g.household.toLowerCase();
                const existing = new Set(state.guests.map(key));
                const unique = list.filter((g) => {
                  const k = key(g);
                  if (existing.has(k)) return false;
                  existing.add(k);
                  return true;
                });
                if (state.guests.length + unique.length > 2000)
                  throw Error("The guest limit is 2,000 per planner.");
                setGuests(unique);
                setSkipped(list.length - unique.length);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Could not read this CSV.",
                );
              }
            }}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {guests.length > 0 && (
          <div className="import-preview">
            <h3>{guests.length} guests ready to add</h3>
            {guests.slice(0, 5).map((g) => (
              <p key={g.id}>
                {g.name}
                <Badge>{g.rsvp}</Badge>
              </p>
            ))}
            {guests.length > 5 && <small>and {guests.length - 5} more</small>}
          </div>
        )}
        {skipped > 0 && (
          <p className="helper-text">
            Skipped {skipped} duplicate entries with the same name, email and
            household.
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="button primary"
            disabled={!guests.length || busy}
            onClick={() => onSave(guests)}
          >
            {busy ? "Importing…" : `Import ${guests.length} guests`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
function UploadDocument({
  demo,
  busy,
  onClose,
  onSave,
}: {
  demo: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (doc: Document) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null),
    [folder, setFolder] = useState("Contracts"),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal
      title="Keep a document close"
      description="Files are private to your signed-in account. Maximum size: 10 MB."
      onClose={() => {
        if (!uploading && !busy) onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (demo) {
            setError(
              "Open your own planner to save documents. The sample doesn’t upload files.",
            );
            return;
          }
          if (!file) return;
          setUploading(true);
          setError("");
          try {
            const data = new FormData();
            data.append("file", file);
            data.append("folder", folder);
            const res = await fetch("/api/documents", {
              method: "POST",
              body: data,
            });
            const doc = (await res.json()) as { error?: string };
            if (!res.ok) throw Error(doc.error || "Upload failed");
            await onSave(documentSchema.parse(doc));
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Upload failed. Please try again.",
            );
          } finally {
            setUploading(false);
          }
        }}
      >
        <fieldset className="form-fields" disabled={uploading || busy}>
          <label className="upload-zone">
            <Upload size={28} />
            <strong>{file?.name || "Choose a document"}</strong>
            <span>Contracts, quotes, receipts or planning notes</span>
            <input
              type="file"
              aria-label="Document file"
              required
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (f && f.size > 10 * 1024 * 1024) {
                  setError("Files must be under 10 MB.");
                  setFile(null);
                } else {
                  setFile(f);
                  setError("");
                }
              }}
            />
          </label>
          <label className="field">
            <span>Folder</span>
            <select value={folder} onChange={(e) => setFolder(e.target.value)}>
              {[
                "Contracts",
                "Quotes",
                "Receipts",
                "Inspiration",
                "General",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary" disabled={!file}>
              {uploading ? "Uploading…" : "Save document"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

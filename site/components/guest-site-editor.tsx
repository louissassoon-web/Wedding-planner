"use client";
import { useEffect, useState } from "react";
import { Globe2, ArrowUpRight, Copy, Check, Plus, Trash2 } from "lucide-react";
import { type GuestSite, guestSiteSchema } from "@/lib/guest-site-schema";
import { formatDate, type PlannerState } from "@/lib/planner";
import { planUrl } from "./sharing";
type SiteLink = { url: string; enabled: boolean };
export function GuestSiteEditor({
  state,
  planId,
  busy,
  demo,
  canManage,
  onSave,
}: {
  state: PlannerState;
  planId: string;
  busy: boolean;
  demo: boolean;
  canManage: boolean;
  onSave: (details: GuestSite) => Promise<boolean>;
}) {
  const [form, setForm] = useState(state.guestSite),
    [site, setSite] = useState<SiteLink | null>(null),
    [error, setError] = useState(""),
    [publishing, setPublishing] = useState(false),
    [copied, setCopied] = useState(false);
  useEffect(() => setForm(state.guestSite), [state.guestSite]);
  useEffect(() => {
    if (demo) return;
    fetch(planUrl("/api/guest-site", planId), { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as { site: SiteLink | null; error?: string };
        if (!r.ok) throw Error(d.error);
        setSite(d.site);
      })
      .catch((e) => setError(e.message));
  }, [planId, demo]);
  const dirty = JSON.stringify(form) !== JSON.stringify(state.guestSite);
  async function save() {
    const parsed = guestSiteSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return false;
    }
    setError("");
    return onSave(parsed.data);
  }
  async function publish(enabled: boolean) {
    setError("");
    setPublishing(true);
    try {
      if (dirty && !(await save())) return;
      const r = await fetch(planUrl("/api/guest-site", planId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const d = (await r.json()) as { site: SiteLink; error?: string };
      if (!r.ok) throw Error(d.error);
      setSite(d.site);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }
  function field(
    name: keyof GuestSite,
    label: string,
    multiline = false,
    hint = "",
  ) {
    return (
      <label className={"field " + (multiline ? "full" : "")}>
        <span>{label}</span>
        {multiline ? (
          <textarea
            rows={3}
            maxLength={4000}
            value={String(form[name])}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          />
        ) : (
          <input
            type={
              name === "contactEmail"
                ? "email"
                : name === "mapUrl"
                  ? "url"
                  : "text"
            }
            maxLength={name === "mapUrl" ? 1000 : 200}
            value={String(form[name])}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          />
        )}{" "}
        {hint && <small>{hint}</small>}
      </label>
    );
  }
  return (
    <div className="guest-editor">
      <section className="guest-publish-card">
        <div className="guest-publish-icon">
          <Globe2 size={26} />
        </div>
        <div>
          <p className="eyebrow">A WARM WELCOME FOR YOUR PEOPLE</p>
          <h2>
            {site?.enabled
              ? "Your guest website is live"
              : "Your invitation, brought to life"}
          </h2>
          <p>
            One wedding page for your invitations. Guests use a private
            household code to RSVP, or open a personal RSVP link.
          </p>
          <span className={"badge " + (site?.enabled ? "green" : "neutral")}>
            {site?.enabled
              ? "Live · anyone with the link"
              : site
                ? "Paused"
                : "Not published yet"}
          </span>
        </div>
        <div className="guest-publish-actions">
          {!demo && (
            <a
              className="button secondary"
              target="_blank"
              rel="noopener"
              href={"/wedding?preview=1&plan=" + encodeURIComponent(planId)}
            >
              Preview saved page <ArrowUpRight size={16} />
            </a>
          )}
          {canManage && !demo && (
            <button
              className={"button " + (site?.enabled ? "secondary" : "primary")}
              disabled={busy || publishing}
              onClick={() => publish(!site?.enabled)}
            >
              {publishing
                ? "Updating…"
                : site?.enabled
                  ? "Pause guest website"
                  : "Publish guest website"}
            </button>
          )}
        </div>
      </section>
      {site && (
        <section className="panel compact guest-link-panel">
          <label className="field">
            <span>Wedding website link for your invitations</span>
            <input
              readOnly
              value={site.url}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(site.url);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
              {copied ? "Copied" : "Copy website link"}
            </button>
            {site.enabled && (
              <a
                className="button primary"
                href={site.url}
                target="_blank"
                rel="noopener"
              >
                Open guest website <ArrowUpRight size={16} />
              </a>
            )}
          </div>
          <p className="helper-text">
            Anyone with this link can read your wedding details. Create
            household invitation codes in Guest list → RSVP links. Guest names
            and replies stay behind those codes. Pausing this page does not
            withdraw existing personal RSVP links.
          </p>
        </section>
      )}
      {demo && (
        <p className="access-banner">
          Sample wedding · publishing is disabled. Open your own planner to
          create your guest website.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await save();
        }}
      >
        <fieldset
          className="form-fields"
          disabled={busy || publishing || !canManage}
        >
          <div className="guest-editor-summary">
            <p>
              <strong>{state.settings.name}</strong> ·{" "}
              {formatDate(state.settings.date)}
            </p>
            <p>
              RSVP deadline:{" "}
              <strong>{formatDate(state.settings.rsvpDeadline)}</strong> ·
              automatically 16 weeks before your wedding.
            </p>
            <a className="text-link" href="/dashboard/settings">
              Edit names, wedding date or venue <ArrowUpRight size={14} />
            </a>
          </div>
          <details className="guest-editor-section" open>
            <summary>
              <span>01</span> Welcome & the day
            </summary>
            <div className="form-grid">
              {field("welcome", "Your welcome message", true)}
              {field(
                "arrivalTime",
                "Arrival time",
                false,
                "Leave blank until confirmed, for example 1:30 pm.",
              )}
              {field("ceremonyTime", "Ceremony time")}
              {field("receptionTime", "Reception time")}
              {field("finishTime", "Finish / carriages")}
              {field("venueAddress", "Venue address", true)}
              {field(
                "mapUrl",
                "Map link (optional)",
                false,
                "Leave blank to use a map search for your venue.",
              )}
              {field("contactEmail", "Guest contact email")}
            </div>
          </details>
          <details className="guest-editor-section">
            <summary>
              <span>02</span> Travel, staying over & what to wear
            </summary>
            <div className="form-grid">
              {field("travel", "Getting here", true)}
              {field("parking", "Parking information", true)}
              {field("accommodation", "Accommodation", true)}
              {field("dressCode", "Dress code", true)}
              <p className="helper-text full">
                Blank travel, accommodation and dress-code sections show “to be
                confirmed” on the guest page.
              </p>
            </div>
          </details>
          <details className="guest-editor-section">
            <summary>
              <span>03</span> Good to know
            </summary>
            <div className="form-grid">
              {field(
                "children",
                "Children / family information (optional)",
                true,
              )}
              {field("gifts", "A note about gifts (optional)", true)}
            </div>
            <div className="guest-custom-faqs">
              {form.faqs.map((f, i) => (
                <div className="instalment" key={f.id}>
                  <div className="section-heading">
                    <h3>Question {i + 1}</h3>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          faqs: form.faqs.filter((x) => x.id !== f.id),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <label className="field">
                    <span>Question</span>
                    <input
                      required
                      maxLength={200}
                      value={f.question}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          faqs: form.faqs.map((x) =>
                            x.id === f.id
                              ? { ...x, question: e.target.value }
                              : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Answer</span>
                    <textarea
                      required
                      rows={3}
                      maxLength={4000}
                      value={f.answer}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          faqs: form.faqs.map((x) =>
                            x.id === f.id
                              ? { ...x, answer: e.target.value }
                              : x,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
              ))}
              <button
                className="button secondary"
                type="button"
                disabled={form.faqs.length >= 20}
                onClick={() =>
                  setForm({
                    ...form,
                    faqs: [
                      ...form.faqs,
                      { id: crypto.randomUUID(), question: "", answer: "" },
                    ],
                  })
                }
              >
                <Plus size={16} /> Add a question
              </button>
            </div>
          </details>
          <details className="guest-editor-section">
            <summary>
              <span>04</span> RSVP questions
            </summary>
            <p className="helper-text">
              Every invitation collects attendance for named guests, meal
              preferences, dietary requirements and allergies, accessibility
              needs, optional contact details and a message.
            </p>
            <label className="field">
              <span>Meal choices (one per line)</span>
              <textarea
                rows={4}
                value={form.mealOptions.join("\n")}
                onChange={(e) =>
                  setForm({ ...form, mealOptions: e.target.value.split("\n") })
                }
                onBlur={() =>
                  setForm({
                    ...form,
                    mealOptions: [
                      ...new Set(
                        form.mealOptions.map((s) => s.trim()).filter(Boolean),
                      ),
                    ],
                  })
                }
              />
              <small>
                Leave blank for an open meal preference field while your menu is
                still being decided.
              </small>
            </label>
            <label className="guest-editor-toggle">
              <input
                type="checkbox"
                checked={form.askSong}
                onChange={(e) =>
                  setForm({ ...form, askSong: e.target.checked })
                }
              />{" "}
              Ask for a song request
            </label>
            <label className="guest-editor-toggle">
              <input
                type="checkbox"
                checked={form.askTransport}
                onChange={(e) =>
                  setForm({ ...form, askTransport: e.target.checked })
                }
              />{" "}
              Ask whether guests would use arranged transport
            </label>
          </details>
          {canManage && (
            <div className="guest-editor-save">
              <p>
                {site?.enabled
                  ? "Saved changes appear on your live guest page."
                  : "Save your details, preview the page, then publish when you’re ready."}
              </p>
              <button className="button primary" type="submit">
                {busy ? "Saving…" : "Save guest details"} <Check size={16} />
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </div>
  );
}

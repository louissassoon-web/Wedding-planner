"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CalendarDays,
  MapPin,
  Mail,
  Heart,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/planner";
import {
  type PublicWedding,
  type GuestReply,
  weddingCalendar,
  formatInviteCode,
} from "@/lib/guest-site";
import { MarigoldMark } from "./marigold-mark";
type Invitation = {
  wedding: PublicWedding;
  guests: GuestReply[];
  submittedAt: string | null;
};
export default function GuestWebsite() {
  const path = usePathname();
  const site = path.startsWith("/wedding/") ? path.split("/")[2] : "";
  const [wedding, setWedding] = useState<PublicWedding | null>(null),
    [invitation, setInvitation] = useState<Invitation | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [code, setCode] = useState(""),
    [saved, setSaved] = useState(false),
    [preview, setPreview] = useState(false);
  const credentials = useRef<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const scroll = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  async function readInvitation(auth: Record<string, string>) {
    const r = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...auth, action: "read" }),
    });
    const data = (await r.json()) as Invitation & { error?: string };
    if (!r.ok) throw Error(data.error || "Unable to open this invitation.");
    credentials.current = auth;
    setInvitation(data);
    setWedding(data.wedding);
    setSaved(!!data.submittedAt);
  }
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const search = new URLSearchParams(window.location.search);
        if (search.get("preview") === "1") {
          setPreview(true);
          const r = await fetch(
            "/api/guest-site?plan=" +
              encodeURIComponent(search.get("plan") || ""),
            { cache: "no-store" },
          );
          const d = (await r.json()) as {
            wedding: PublicWedding;
            error?: string;
          };
          if (!r.ok) throw Error(d.error);
          if (!cancelled) setWedding(d.wedding);
        } else if (site) {
          const r = await fetch("/api/wedding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ site }),
          });
          const d = (await r.json()) as {
            wedding: PublicWedding;
            error?: string;
          };
          if (!r.ok) throw Error(d.error);
          if (!cancelled) setWedding(d.wedding);
        } else {
          const token = window.location.hash.slice(1);
          if (!token)
            throw Error(
              "Open the wedding link from your invitation, or ask the couple for a new one.",
            );
          await readInvitation({ token });
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [site]);
  function patch(id: string, change: Partial<GuestReply>) {
    if (!invitation) return;
    setInvitation({
      ...invitation,
      guests: invitation.guests.map((g) =>
        g.id === id ? { ...g, ...change } : g,
      ),
    });
  }
  function addCalendar() {
    if (!wedding?.date) return;
    const url = URL.createObjectURL(
      new Blob([weddingCalendar(wedding)], {
        type: "text/calendar;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "our-wedding.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const details = wedding?.details;
  const names =
    wedding?.partner1 && wedding.partner2
      ? [wedding.partner1, wedding.partner2]
      : [wedding?.name || "You’re invited"];
  if (loading || !wedding)
    return (
      <div className="guest-shell guest-loading">
        <MarigoldMark size={66} />
        <h1>
          {loading ? "Something lovely awaits." : "Let’s find your invitation."}
        </h1>
        <p>{loading ? "Opening your wedding page…" : error}</p>
        {!loading && (
          <a className="button primary" href="/">
            Open planner <ArrowRight size={16} />
          </a>
        )}
      </div>
    );
  const timings = [
    ["Arrive", details!.arrivalTime],
    ["The ceremony", details!.ceremonyTime],
    ["The celebration", details!.receptionTime],
    ["Carriages", details!.finishTime],
  ];
  const faqs = [
    {
      id: "who",
      question: "Who is included in my invitation?",
      answer:
        "Your RSVP shows each person included in your invitation. If a name is missing or you need to check something, please get in touch with us.",
    },
    {
      id: "change",
      question: "Can I change my RSVP?",
      answer:
        "Of course. Use the same personal link or household invitation code to return to your reply and update it.",
    },
    {
      id: "food",
      question: "How do I tell you about dietary or accessibility needs?",
      answer:
        "There is a space for each person’s dietary requirements, allergies and accessibility needs in the RSVP form. Please include anything that would help us make you comfortable.",
    },
    ...details!.faqs,
  ];
  return (
    <div className="guest-shell">
      {preview && (
        <div className="guest-preview-banner">
          Guest website preview · RSVP submissions are disabled here.
          <a href="/dashboard/guest-website">
            Back to planner <ArrowUpRight size={14} />
          </a>
        </div>
      )}
      <header className="guest-header">
        <button
          className="guest-wordmark"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <MarigoldMark size={28} />
          <span>
            {names.length === 2
              ? names[0][0] + " & " + names[1][0]
              : "Marigold"}
          </span>
        </button>
        <nav aria-label="Wedding information">
          <button onClick={() => scroll("the-day")}>The day</button>
          <button onClick={() => scroll("getting-here")}>Getting here</button>
          <button onClick={() => scroll("guest-questions")}>
            Good to know
          </button>
        </nav>
        <button
          className="button primary guest-header-rsvp"
          onClick={() => scroll("our-rsvp")}
        >
          RSVP <ArrowUpRight size={15} />
        </button>
      </header>
      <main>
        <section className="guest-hero">
          <div className="guest-hero-copy">
            <p className="eyebrow">WITH OUR FAVOURITE PEOPLE</p>
            <h1>
              {names.length === 2 ? (
                <>
                  <span>{names[0]}</span>
                  <em>&</em>
                  <span>{names[1]}</span>
                </>
              ) : (
                names[0]
              )}
            </h1>
            <p className="guest-hero-invitation">
              A day for love.
              <br />A celebration with you.
            </p>
            <div className="guest-date">
              <CalendarDays size={18} />
              <span>
                {wedding.date
                  ? formatDate(wedding.date)
                  : "Date to be confirmed"}
              </span>
            </div>
            <p className="guest-hero-venue">
              {wedding.venue || "Venue details to follow"}
            </p>
            <button
              className="button primary guest-main-cta"
              onClick={() => scroll("our-rsvp")}
            >
              We’d love you there <ArrowRight size={18} />
            </button>
            {wedding.deadline && (
              <small className="guest-deadline">
                Kindly RSVP by {formatDate(wedding.deadline)}
              </small>
            )}
          </div>
          <div className="guest-hero-art">
            <div className="guest-photo-frame">
              <img
                src="/brand/marigold-flowers.jpg"
                alt="A bright marigold dahlia and small white flowers in a clear glass vase"
              />
              <span className="guest-photo-note">
                A little sunshine.
                <br />
                <em>A lot of love.</em>
              </span>
            </div>
            <MarigoldMark size={88} className="guest-flower-stamp" />
            <span className="guest-art-caption">
              OUR WEDDING CELEBRATION
            </span>
          </div>
        </section>
        <section className="guest-welcome">
          <MarigoldMark size={38} />
          <p>{details!.welcome}</p>
          <span className="guest-tiny-flower">✳</span>
        </section>
        <section id="the-day" className="guest-section">
          <div className="guest-section-heading">
            <div>
              <p className="eyebrow">01 / THE DAY</p>
              <h2>Let’s make a day of it.</h2>
            </div>
            {wedding.date && (
              <button className="guest-text-link" onClick={addCalendar}>
                <CalendarDays size={17} /> Save the date
              </button>
            )}
          </div>
          <div className="guest-day-grid">
            <div className="guest-venue">
              <MapPin size={24} />
              <h3>{wedding.venue || "Somewhere wonderful"}</h3>
              {details!.venueAddress && (
                <p className="preserve-lines">{details!.venueAddress}</p>
              )}
              <p>
                {wedding.date
                  ? formatDate(wedding.date)
                  : "Date to be confirmed"}
              </p>
              {wedding.venue && (
                <a
                  className="guest-text-link"
                  href={
                    details!.mapUrl ||
                    "https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(
                        [wedding.venue, details!.venueAddress]
                          .filter(Boolean)
                          .join(", "),
                      )
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find the venue <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            <div className="guest-timings">
              {timings.some(([, time]) => time) ? (
                timings.map(([label, time]) => (
                  <div key={label}>
                    <span>{time || "TBC"}</span>
                    <h3>{label}</h3>
                  </div>
                ))
              ) : (
                <>
                  <p className="eyebrow">THE LITTLE DETAILS</p>
                  <h3>Good things are coming together.</h3>
                  <p>
                    Our timings are still to be confirmed. We’ll share the plan
                    for the day here as soon as it’s ready.
                  </p>
                  <div className="guest-timing-tbc">
                    <span>
                      Ceremony <b>TBC</b>
                    </span>
                    <span>
                      Reception <b>TBC</b>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
        <section id="getting-here" className="guest-section guest-travel">
          <div className="guest-section-heading">
            <div>
              <p className="eyebrow">02 / GETTING HERE & STAYING OVER</p>
              <h2>A little help with the journey.</h2>
            </div>
            <MarigoldMark size={52} />
          </div>
          <div className="guest-info-columns">
            <article>
              <span className="guest-info-number">01</span>
              <h3>Travel & parking</h3>
              <p className="preserve-lines">
                {details!.travel ||
                  "Travel information is to be confirmed. We’ll add the useful routes and details here."}
              </p>
              {details!.parking && (
                <p className="preserve-lines">{details!.parking}</p>
              )}
            </article>
            <article>
              <span className="guest-info-number">02</span>
              <h3>Somewhere to stay</h3>
              <p className="preserve-lines">
                {details!.accommodation ||
                  "Accommodation information is to be confirmed. Please check back a little closer to the day."}
              </p>
            </article>
            <article>
              <span className="guest-info-number">03</span>
              <h3>What to wear</h3>
              <p className="preserve-lines">
                {details!.dressCode ||
                  "Dress code to be confirmed. We’ll share more here soon."}
              </p>
            </article>
          </div>
        </section>
        <section id="our-rsvp" className="guest-rsvp-section">
          <div className="guest-rsvp-intro">
            <p className="eyebrow">03 / YOUR REPLY</p>
            <h2>
              Save us
              <br />a little <em>yes.</em>
            </h2>
            <p>We can’t wait to celebrate with you.</p>
            {wedding.deadline && (
              <p className="guest-rsvp-deadline">
                Please reply by
                <br />
                <strong>{formatDate(wedding.deadline)}</strong>
              </p>
            )}
            <MarigoldMark size={110} />
          </div>
          <div className="guest-rsvp-form" ref={formRef}>
            {preview ? (
              <div className="guest-code-card">
                <h3>A personal welcome for every household.</h3>
                <p>
                  Guests enter their invitation code here, or open their
                  personal RSVP link. They can reply for each named guest, share
                  meal preferences, dietary and accessibility needs, and leave
                  you a note.
                </p>
                <p className="helper-text">
                  Create invitations from Guest list → RSVP links.
                </p>
              </div>
            ) : !invitation ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  setBusy(true);
                  try {
                    await readInvitation({ site, code });
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <h3>Your invitation, right this way.</h3>
                <p>
                  Enter the household code from your invitation. No account
                  needed.
                </p>
                <label className="field">
                  <span>Invitation code</span>
                  <input
                    required
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={20}
                    value={code}
                    onChange={(e) => setCode(formatInviteCode(e.target.value))}
                    placeholder="ABCD-EFGH-JKLM"
                    aria-describedby="code-help"
                  />
                </label>
                <p className="helper-text" id="code-help">
                  Your code opens only the people named on your invitation.
                  Can’t find it? Get in touch below.
                </p>
                <button
                  className="button primary"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Opening…" : "Find my invitation"}{" "}
                  <ArrowRight size={17} />
                </button>
              </form>
            ) : saved ? (
              <div className="guest-thanks" ref={feedback} tabIndex={-1}>
                <span className="guest-thanks-mark">
                  <Check size={30} />
                </span>
                <p className="eyebrow">REPLY RECEIVED</p>
                <h3>Thank you, {invitation.guests[0]?.name.split(" ")[0]}.</h3>
                <p>
                  Your reply is safely with us. You can come back to this page
                  any time to make a change.
                </p>
                <ul>
                  {invitation.guests.map((g) => (
                    <li key={g.id}>
                      <strong>{g.name}</strong>
                      <span>
                        {g.rsvp === "confirmed"
                          ? "Joyfully accepts"
                          : g.rsvp === "declined"
                            ? "Regretfully declines"
                            : "Still to confirm"}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className="button secondary"
                  onClick={() => setSaved(false)}
                >
                  Update our reply
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  setBusy(true);
                  try {
                    const r = await fetch("/api/rsvp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...credentials.current,
                        action: "respond",
                        guests: invitation.guests.map(({ name, ...g }) => g),
                      }),
                    });
                    const d = (await r.json()) as {
                      error?: string;
                      submittedAt: string;
                    };
                    if (!r.ok)
                      throw Error(
                        d.error ||
                          "Your reply could not be saved. Please try again.",
                      );
                    setInvitation({
                      ...invitation,
                      submittedAt: d.submittedAt,
                    });
                    setSaved(true);
                    setTimeout(() => feedback.current?.focus(), 0);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className="guest-reply-heading">
                  <h3>Hello, lovely people.</h3>
                  <p>Please reply for everyone named below.</p>
                </div>
                <fieldset disabled={busy} className="form-fields">
                  {invitation.guests.map((g, i) => (
                    <section className="guest-person" key={g.id}>
                      <h4>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        {g.name}
                      </h4>
                      <fieldset className="guest-attendance">
                        <legend>Will you be joining us?</legend>
                        {[
                          ["confirmed", "Joyfully accepts"],
                          ["declined", "Regretfully declines"],
                          ["maybe", "Still to confirm"],
                        ].map(([value, label]) => (
                          <label
                            className={g.rsvp === value ? "selected" : ""}
                            key={value}
                          >
                            <input
                              required
                              type="radio"
                              name={"attendance-" + g.id}
                              value={value}
                              checked={g.rsvp === value}
                              onChange={() =>
                                patch(g.id, {
                                  rsvp: value as GuestReply["rsvp"],
                                })
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </fieldset>
                      {g.rsvp !== "declined" && (
                        <>
                          <label className="field">
                            <span>
                              {details!.mealOptions.length
                                ? "Meal choice"
                                : "Meal preference (optional)"}
                            </span>
                            {details!.mealOptions.length ? (
                              <select
                                required={g.rsvp === "confirmed"}
                                value={g.meal}
                                onChange={(e) =>
                                  patch(g.id, { meal: e.target.value })
                                }
                              >
                                <option value="">Choose a meal</option>
                                {details!.mealOptions.map((m) => (
                                  <option key={m}>{m}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={g.meal}
                                maxLength={200}
                                placeholder="For example, vegetarian or vegan"
                                onChange={(e) =>
                                  patch(g.id, { meal: e.target.value })
                                }
                              />
                            )}
                          </label>
                          <label className="field">
                            <span>
                              Dietary requirements & allergies (optional)
                            </span>
                            <textarea
                              rows={3}
                              maxLength={4000}
                              value={g.dietary}
                              placeholder="Please include any allergies and anything our caterer should know."
                              onChange={(e) =>
                                patch(g.id, { dietary: e.target.value })
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Accessibility needs (optional)</span>
                            <textarea
                              rows={2}
                              maxLength={4000}
                              value={g.accessibility}
                              placeholder="Anything we can do to help you enjoy the day?"
                              onChange={(e) =>
                                patch(g.id, { accessibility: e.target.value })
                              }
                            />
                          </label>
                          {details!.askTransport && (
                            <label className="field">
                              <span>Would you use arranged transport?</span>
                              <select
                                value={g.transport}
                                onChange={(e) =>
                                  patch(g.id, {
                                    transport: e.target
                                      .value as GuestReply["transport"],
                                  })
                                }
                              >
                                <option value="">Not sure yet</option>
                                <option value="yes">Yes, please</option>
                                <option value="no">I’ll arrange my own</option>
                              </select>
                            </label>
                          )}
                        </>
                      )}
                      <details className="guest-extras">
                        <summary>
                          Contact details & a little note <span>Optional</span>
                        </summary>
                        <label className="field">
                          <span>Contact email (optional)</span>
                          <input
                            type="email"
                            maxLength={200}
                            value={g.replyEmail}
                            onChange={(e) =>
                              patch(g.id, { replyEmail: e.target.value })
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Contact phone (optional)</span>
                          <input
                            type="tel"
                            maxLength={200}
                            value={g.replyPhone}
                            onChange={(e) =>
                              patch(g.id, { replyPhone: e.target.value })
                            }
                          />
                        </label>
                        {details!.askSong && g.rsvp !== "declined" && (
                          <label className="field">
                            <span>A song to get you dancing (optional)</span>
                            <input
                              maxLength={200}
                              value={g.songRequest}
                              onChange={(e) =>
                                patch(g.id, { songRequest: e.target.value })
                              }
                            />
                          </label>
                        )}
                        <label className="field">
                          <span>A message for us (optional)</span>
                          <textarea
                            rows={2}
                            maxLength={4000}
                            value={g.message}
                            onChange={(e) =>
                              patch(g.id, { message: e.target.value })
                            }
                          />
                        </label>
                      </details>
                    </section>
                  ))}
                  <p className="guest-privacy">
                    Your replies, contact details and dietary or accessibility
                    notes are shared with us and our planning team. Please keep
                    your invitation link and code within your household.
                  </p>
                  <button className="button primary" type="submit">
                    {busy ? (
                      <>
                        <Loader2 className="spin" size={16} /> Sending…
                      </>
                    ) : (
                      <>
                        Send our RSVP <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </fieldset>
              </form>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>
        <section id="guest-questions" className="guest-section guest-faq">
          <div>
            <p className="eyebrow">04 / GOOD TO KNOW</p>
            <h2>
              The little
              <br />
              <em>questions.</em>
            </h2>
            <p>
              Something else on your mind?
              <br />
              We’re only a message away.
            </p>
          </div>
          <div>
            {details!.children && (
              <details>
                <summary>Are children invited?</summary>
                <p className="preserve-lines">{details!.children}</p>
              </details>
            )}
            {details!.gifts && (
              <details>
                <summary>A note about gifts</summary>
                <p className="preserve-lines">{details!.gifts}</p>
              </details>
            )}
            {faqs.map((f) => (
              <details key={f.id}>
                <summary>{f.question}</summary>
                <p className="preserve-lines">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="guest-contact">
          <MarigoldMark size={40} />
          <h2>Here’s to a lovely day.</h2>
          <p>We’re so happy you’re part of it.</p>
          {details!.contactEmail && (
            <a href={"mailto:" + details!.contactEmail}>
              <Mail size={17} />
              {details!.contactEmail}
            </a>
          )}
          <span className="guest-signoff">{names.join(" & ")}</span>
        </section>
      </main>
      <footer className="guest-footer">
        <span>
          Made with love. Planned with <em>Marigold.</em>
        </span>
        <a
          href="https://www.lestudiodekex.com/pages/galerie-photos-mariage"
          target="_blank"
          rel="noopener noreferrer"
        >
          Floral photography · Le Studio de Kex
        </a>
        <a href="/">
          Couple’s planner <ArrowUpRight size={13} />
        </a>
      </footer>
    </div>
  );
}

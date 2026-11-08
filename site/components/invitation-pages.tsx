"use client";
import { useEffect, useState } from "react";
import { Heart, Check, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/planner";
type Reply = {
  id: string;
  name: string;
  rsvp: string;
  meal: string;
  dietary: string;
};
type Invite = {
  wedding: { name: string; date: string; venue: string; deadline: string };
  guests: Reply[];
  submittedAt: string | null;
};
export function RsvpPage() {
  const [token, setToken] = useState(""),
    [invite, setInvite] = useState<Invite | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    const t = window.location.hash.slice(1);
    setToken(t);
    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: t, action: "read" }),
    })
      .then(async (r) => {
        const d = (await r.json()) as Invite & {
          error: string;
          submittedAt: string;
          planId: string;
        };
        if (!r.ok) throw Error(d.error);
        setInvite(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, []);
  function patch(id: string, change: Partial<Reply>) {
    if (!invite) return;
    setSaved(false);
    setInvite({
      ...invite,
      guests: invite.guests.map((g) => (g.id === id ? { ...g, ...change } : g)),
    });
  }
  return (
    <div className="invitation-page">
      <a className="brand" href="/">
        <Heart size={24} />
        Our Wedding
      </a>
      <main className="invitation-card">
        <p className="eyebrow">A DAY TO SHARE</p>
        <h1>{invite?.wedding.name || "Your invitation"}</h1>
        {invite && (
          <>
            <p className="invitation-date">
              {formatDate(invite.wedding.date)}
              {invite.wedding.venue && " · " + invite.wedding.venue}
            </p>
            <h2>Will you be joining us?</h2>
            <p>
              {invite.wedding.deadline
                ? "Please reply by " + formatDate(invite.wedding.deadline) + "."
                : "We’d love to hear from you."}{" "}
              You can update your reply using this same link.
            </p>
            {invite.submittedAt && !saved && (
              <p className="helper-text">Your previous reply is shown below.</p>
            )}
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
                      token,
                      action: "respond",
                      guests: invite.guests.map(
                        ({ id, rsvp, meal, dietary }) => ({
                          id,
                          rsvp,
                          meal,
                          dietary,
                        }),
                      ),
                    }),
                  });
                  const d = (await r.json()) as Invite & {
                    error: string;
                    submittedAt: string;
                    planId: string;
                  };
                  if (!r.ok) throw Error(d.error);
                  setSaved(true);
                  setInvite({ ...invite, submittedAt: d.submittedAt });
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <fieldset disabled={busy} className="form-fields">
                {invite.guests.map((g) => (
                  <section className="rsvp-person" key={g.id}>
                    <h3>{g.name}</h3>
                    <label className="field">
                      <span>Your reply</span>
                      <select
                        required
                        value={g.rsvp === "pending" ? "" : g.rsvp}
                        onChange={(e) => patch(g.id, { rsvp: e.target.value })}
                      >
                        <option value="" disabled>
                          Choose a reply
                        </option>
                        <option value="confirmed">Joyfully accepts</option>
                        <option value="declined">Regretfully declines</option>
                        <option value="maybe">Still to confirm</option>
                      </select>
                    </label>
                    {g.rsvp !== "declined" && (
                      <div className="form-grid">
                        <label className="field">
                          <span>Meal preference (optional)</span>
                          <input
                            maxLength={200}
                            value={g.meal}
                            onChange={(e) =>
                              patch(g.id, { meal: e.target.value })
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Dietary needs or allergies (optional)</span>
                          <textarea
                            maxLength={4000}
                            rows={2}
                            value={g.dietary}
                            onChange={(e) =>
                              patch(g.id, { dietary: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    )}
                  </section>
                ))}
                <p className="helper-text">
                  Your replies and dietary notes are shared with the couple and
                  their planning team. This private link covers only the guests
                  named above; please keep it within your household.
                </p>
                <button className="button primary" type="submit">
                  {busy ? "Saving your reply…" : "Send RSVP"}{" "}
                  <ArrowRight size={17} />
                </button>
              </fieldset>
            </form>
          </>
        )}
        {busy && !invite && <p>Opening your invitation…</p>}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <div className="success-banner" role="status">
            <Check size={20} />
            <div>
              <strong>Thank you. Your reply is saved.</strong>
              <p>The couple’s guest list has been updated.</p>
            </div>
          </div>
        )}
      </main>
      <p className="invitation-footer">With love, and a little less admin.</p>
    </div>
  );
}
export function JoinPage() {
  const [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [signin, setSignin] = useState(false);
  useEffect(() => setToken(window.location.hash.slice(1)), []);
  return (
    <div className="invitation-page">
      <a className="brand" href="/">
        <Heart size={24} />
        Our Wedding
      </a>
      <main className="invitation-card">
        <p className="eyebrow">PLAN SOMETHING LOVELY, TOGETHER</p>
        <h1>Join the wedding team</h1>
        <p>
          Use the ChatGPT account with the email address the couple invited.
          Your access level is set by the wedding owner.
        </p>
        {!signin && (
          <button
            className="button primary"
            disabled={busy || !token}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await fetch("/api/join", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token }),
                });
                const d = (await r.json()) as Invite & {
                  error: string;
                  submittedAt: string;
                  planId: string;
                };
                if (r.status === 401) {
                  setSignin(true);
                  return;
                }
                if (!r.ok) throw Error(d.error);
                try {
                  localStorage.setItem("wedding-selected-plan", d.planId);
                } catch {}
                window.location.assign("/");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Joining…" : "Accept invitation"} <ArrowRight size={17} />
          </button>
        )}
        {signin && (
          <a
            className="button primary"
            target="_top"
            href={
              "/signin-with-chatgpt?return_to=" +
              encodeURIComponent("/join#" + token)
            }
          >
            Sign in to accept <ArrowRight size={17} />
          </a>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="helper-text">
          Invitations expire after 7 days. Contact the couple if you need a
          fresh link.
        </p>
      </main>
    </div>
  );
}

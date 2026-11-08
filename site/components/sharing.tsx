"use client";
import { useEffect, useState } from "react";
import { Copy, Check, Link2, Users, RefreshCw } from "lucide-react";
import { active, formatDate, type PlannerState } from "@/lib/planner";
import type { Role } from "@/lib/access";
export const planUrl = (path: string, planId: string) =>
  path +
  (path.includes("?") ? "&" : "?") +
  "plan=" +
  encodeURIComponent(planId);
async function api<T>(path: string, method = "GET", data?: unknown) {
  const res = await fetch(path, {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = (await res.json()) as T & { error?: string };
  if (!res.ok) throw Error(result.error || "Unable to complete this action.");
  return result;
}
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copy-link">
      <label className="field">
        <span>Your private invitation link</span>
        <input readOnly value={url} onFocus={(e) => e.target.select()} />
      </label>
      <button
        type="button"
        className="button secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
        {copied ? "Copied" : "Copy link"}
      </button>
      <small>
        Share this link with the intended recipient. You can withdraw it below.
      </small>
    </div>
  );
}
const roleLabels: Record<Role, string> = {
  owner: "Wedding owner",
  editor: "Partner / full editor",
  planner: "Planner / logistics",
  viewer: "Read only",
};
type Member = { id: string; email: string; role: Role };
type TeamInvite = Member & {
  expires_at: string;
  accepted_by: string | null;
  revoked: number;
};
type Activity = { actor: string; action: string; created_at: string };
export function TeamPanel({
  planId,
  role,
  demo,
}: {
  planId: string;
  role: Role;
  demo: boolean;
}) {
  const [members, setMembers] = useState<Member[]>([]),
    [invites, setInvites] = useState<TeamInvite[]>([]),
    [history, setHistory] = useState<Activity[]>([]),
    [email, setEmail] = useState(""),
    [inviteRole, setInviteRole] = useState<Role>("editor"),
    [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const endpoint = planUrl("/api/team", planId);
  async function load() {
    try {
      const d = await api<{
        members: Member[];
        invites: TeamInvite[];
        history: Activity[];
      }>(endpoint);
      setMembers(d.members);
      setInvites(d.invites);
      setHistory(d.history);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!demo) void load();
  }, [planId, demo]);
  async function revoke(id: string, kind: string) {
    setBusy(true);
    setError("");
    try {
      await api(endpoint, "DELETE", { id, kind });
      setUrl("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel compact team-panel">
      <p className="eyebrow">BETTER TOGETHER</p>
      <h2>
        <Users size={22} /> Your planning team
      </h2>
      <p>
        Your access: <strong>{roleLabels[role]}</strong>. Everyone works from
        the same saved plan. Use “Refresh plan” to see the latest replies and
        changes.
      </p>
      {demo ? (
        <p className="helper-text">
          Open your own planner to invite someone. Sample weddings cannot be
          shared.
        </p>
      ) : (
        <>
          {role === "owner" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                setUrl("");
                try {
                  const d = await api<{ url: string }>(endpoint, "POST", {
                    email,
                    role: inviteRole,
                  });
                  setUrl(d.url);
                  setEmail("");
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <fieldset disabled={busy} className="form-fields">
                <div className="form-grid">
                  <label className="field">
                    <span>Invite by email</span>
                    <input
                      required
                      type="email"
                      maxLength={200}
                      placeholder="partner@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Access level</span>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                    >
                      <option value="editor">Partner / full editor</option>
                      <option value="planner">Planner / logistics</option>
                      <option value="viewer">Read only</option>
                    </select>
                  </label>
                </div>
                <p className="helper-text">
                  Full editors can see and edit all planning details. Planners
                  can edit guests, tasks, suppliers, seating and timings; budget
                  and documents stay private. Viewers can see everything but
                  cannot change it. Only you can manage team access.
                </p>
                <button className="button primary" type="submit">
                  <Link2 size={16} /> {busy ? "Creating…" : "Create invitation"}
                </button>
                <p className="helper-text">
                  Copy and send the link yourself. It expires in 7 days and
                  requires sign-in with the invited email address.
                </p>
              </fieldset>
            </form>
          )}
          {url && <CopyLink url={url} />}
          {members.map((m) => (
            <div className="share-row" key={m.id}>
              <div>
                <strong>{m.email}</strong>
                <small>{roleLabels[m.role]}</small>
              </div>
              {role === "owner" && (
                <button
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => revoke(m.id, "member")}
                >
                  Remove access
                </button>
              )}
            </div>
          ))}
          {!members.length && (
            <p className="helper-text">
              No one else has joined this wedding yet.
            </p>
          )}
          {invites
            .filter((i) => !i.accepted_by)
            .map((i) => (
              <div className="share-row" key={i.id}>
                <div>
                  <strong>{i.email}</strong>
                  <small>
                    {roleLabels[i.role]} ·{" "}
                    {i.revoked
                      ? "Withdrawn"
                      : i.expires_at < new Date().toISOString()
                        ? "Expired"
                        : "Expires " + formatDate(i.expires_at.slice(0, 10))}
                  </small>
                </div>
                {!i.revoked && i.expires_at > new Date().toISOString() && (
                  <button
                    className="button secondary small"
                    disabled={busy}
                    onClick={() => revoke(i.id, "invite")}
                  >
                    Withdraw
                  </button>
                )}
              </div>
            ))}
          <div className="section-heading">
            <h3>Recent activity</h3>
            <button
              className="icon-button"
              aria-label="Refresh activity"
              onClick={() => void load()}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {history.slice(0, 10).map((a, i) => (
            <div className="activity-row" key={i}>
              <strong>{a.action}</strong>
              <small>
                {a.actor} · {new Date(a.created_at).toLocaleString("en-GB")}
              </small>
            </div>
          ))}
          {!history.length && (
            <p className="helper-text">
              Saved changes and guest replies will appear here.
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}
type RsvpInvite = {
  id: string;
  guest_ids: string;
  expires_at: string;
  revoked: number;
  last_submitted: string | null;
};
export function RsvpLinks({
  state,
  planId,
  demo,
}: {
  state: PlannerState;
  planId: string;
  demo: boolean;
}) {
  const guests = active(state.guests);
  const [selected, setSelected] = useState<string[]>([]),
    [invites, setInvites] = useState<RsvpInvite[]>([]),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState(""),
    [websiteUrl, setWebsiteUrl] = useState(""),
    [detailsCopied, setDetailsCopied] = useState(false);
  const endpoint = planUrl("/api/invitations", planId);
  async function load() {
    try {
      const d = await api<{ invites: RsvpInvite[] }>(endpoint);
      setInvites(d.invites);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!demo) {
      void load();
      void api<{ site: { url: string; enabled: boolean } | null }>(
        planUrl("/api/guest-site", planId),
      )
        .then((d) => setWebsiteUrl(d.site?.enabled ? d.site.url : ""))
        .catch(() => {});
    }
  }, [planId, demo]);
  const households = [
    ...new Set(guests.map((g) => g.household).filter(Boolean)),
  ];
  return (
    <div>
      <p className="helper-text">
        Create a link for a person or household. Anyone with that link can view
        and update only those guests’ replies, meal choices, dietary and
        accessibility notes. Add each plus-one as a named guest first.
      </p>
      {demo ? (
        <p className="form-error">
          Open your own planner to create invitations.
        </p>
      ) : (
        <>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              setUrl("");
              try {
                const d = await api<{ url: string; code: string }>(
                  endpoint,
                  "POST",
                  {
                    guestIds: selected,
                  },
                );
                setUrl(d.url);
                setInviteCode(d.code);
                setDetailsCopied(false);
                await load();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="form-fields">
              <label className="field">
                <span>Select a household</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    setSelected(
                      guests
                        .filter(
                          (g) =>
                            g.household === e.target.value && e.target.value,
                        )
                        .map((g) => g.id),
                    );
                    setUrl("");
                  }}
                >
                  <option value="">Choose guests individually</option>
                  {households.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
              <div className="guest-picker">
                {guests.map((g) => (
                  <label key={g.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(g.id)}
                      onChange={(e) => {
                        setUrl("");
                        setSelected(
                          e.target.checked
                            ? [...selected, g.id]
                            : selected.filter((id) => id !== g.id),
                        );
                      }}
                    />
                    <span>
                      {g.name}
                      <small>{g.household || g.group}</small>
                    </span>
                  </label>
                ))}
              </div>
              <button
                className="button primary"
                disabled={!selected.length || selected.length > 20}
                type="submit"
              >
                <Link2 size={16} />{" "}
                {busy
                  ? "Creating…"
                  : `Create link for ${selected.length} ${selected.length === 1 ? "guest" : "guests"}`}
              </button>
              <small>
                Up to 20 named guests per link. Links are shown once; copy
                before closing.
              </small>
            </fieldset>
          </form>
          {url && (
            <>
              <CopyLink url={url} />
              <div className="invitation-code-box">
                <p className="eyebrow">FOR PRINTED INVITATIONS</p>
                <strong>Household invitation code</strong>
                <code>{inviteCode}</code>
                {websiteUrl ? (
                  <>
                    <label className="field">
                      <span>Wedding website</span>
                      <input
                        readOnly
                        value={websiteUrl}
                        onFocus={(e) => e.target.select()}
                      />
                    </label>
                    <button
                      className="button secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            [
                              "We’d love you to join us.",
                              websiteUrl,
                              "Your invitation code: " + inviteCode,
                            ].join("\n"),
                          );
                          setDetailsCopied(true);
                        } catch {
                          setDetailsCopied(false);
                        }
                      }}
                    >
                      {detailsCopied ? "Copied" : "Copy invitation details"}
                    </button>
                  </>
                ) : (
                  <a className="text-link" href="/dashboard/guest-website">
                    Publish your shared wedding website
                  </a>
                )}
                <small>
                  Use the website address and code on a printed invite, or share
                  the personal link above. Copy now: the code is only shown
                  once.
                </small>
              </div>
            </>
          )}
          <h3 className="spaced-heading">Your invitations</h3>
          {invites.map((i) => (
            <div className="share-row" key={i.id}>
              <div>
                <strong>
                  {(JSON.parse(i.guest_ids) as string[])
                    .map(
                      (id) =>
                        state.guests.find((g) => g.id === id)?.name ||
                        "Archived guest",
                    )
                    .join(", ")}
                </strong>
                <small>
                  {i.revoked
                    ? "Withdrawn"
                    : i.expires_at < new Date().toISOString()
                      ? "Expired"
                      : i.last_submitted
                        ? "Reply received · " +
                          formatDate(i.last_submitted.slice(0, 10))
                        : "Awaiting a reply"}
                </small>
              </div>
              {!i.revoked && (
                <button
                  className="button secondary small"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api(endpoint, "DELETE", { id: i.id });
                      setUrl("");
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Withdraw
                </button>
              )}
            </div>
          ))}
          {!invites.length && (
            <p className="helper-text">No RSVP links created yet.</p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}

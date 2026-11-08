"use client";
import { useEffect, useState } from "react";
import { Heart, Check, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/planner";
import { MarigoldMark } from "./marigold-mark";
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
export function JoinPage() {
  const [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [signin, setSignin] = useState(false);
  useEffect(() => setToken(window.location.hash.slice(1)), []);
  return (
    <div className="invitation-page">
      <a className="brand" href="/">
        <MarigoldMark size={28} />
        Marigold
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

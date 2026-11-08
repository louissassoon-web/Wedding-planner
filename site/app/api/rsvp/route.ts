import { z } from "zod";
import { stateSchema } from "@/lib/planner";
import {
  db,
  readPlan,
  body,
  json,
  failure,
  HttpError,
  tokenHash,
  audit,
} from "@/lib/server-plan";
export const dynamic = "force-dynamic";
const response = z
  .object({
    id: z.string(),
    rsvp: z.enum(["confirmed", "declined", "maybe"]),
    meal: z.string().trim().max(200),
    dietary: z.string().max(4000),
  })
  .strict();
export async function POST(req: Request) {
  try {
    const input = await body(req);
    const hash = await tokenHash(String(input.token || ""));
    const invite = await db()
      .prepare(
        "SELECT id,plan_id,guest_ids,expires_at,last_submitted FROM wedding_invites WHERE token_hash=? AND kind='rsvp' AND revoked=0 AND expires_at>?",
      )
      .bind(hash, new Date().toISOString())
      .first<{
        id: string;
        plan_id: string;
        guest_ids: string;
        expires_at: string;
        last_submitted: string | null;
      }>();
    if (!invite)
      throw new HttpError(
        "This RSVP link has expired or was withdrawn. Please contact the couple.",
        404,
      );
    const ids = JSON.parse(invite.guest_ids) as string[];
    if (input.action === "read") {
      const p = await readPlan(invite.plan_id);
      const guests = p.state.guests
        .filter((g) => ids.includes(g.id) && !g.archived)
        .map((g) => ({
          id: g.id,
          name: g.name,
          rsvp: g.rsvp,
          meal: g.meal,
          dietary: g.dietary,
        }));
      if (!guests.length)
        throw new HttpError("This invitation is no longer active.", 410);
      return json({
        wedding: {
          name: p.state.settings.name,
          date: p.state.settings.date,
          venue: p.state.settings.venue,
          deadline: p.state.settings.rsvpDeadline,
        },
        guests,
        submittedAt: invite.last_submitted,
      });
    }
    if (input.action !== "respond") throw new HttpError("Invalid action");
    const replies = z.array(response).min(1).max(20).parse(input.guests);
    if (
      new Set(replies.map((g) => g.id)).size !== replies.length ||
      replies.some((g) => !ids.includes(g.id))
    )
      throw new HttpError(
        "This link only allows replies for the invited guests.",
        403,
      );
    for (let attempt = 0; attempt < 3; attempt++) {
      const p = await readPlan(invite.plan_id);
      const activeIds = p.state.guests
        .filter((g) => ids.includes(g.id) && !g.archived)
        .map((g) => g.id);
      if (
        replies.length !== activeIds.length ||
        replies.some((g) => !activeIds.includes(g.id))
      )
        throw new HttpError(
          "The invitation changed. Refresh before replying.",
          409,
        );
      const next = stateSchema.parse({
        ...p.state,
        guests: p.state.guests.map((g) => {
          const r = replies.find((r) => r.id === g.id);
          return r
            ? { ...g, ...r, table: r.rsvp === "confirmed" ? g.table : "" }
            : g;
        }),
      });
      const now = new Date().toISOString();
      const result = await db()
        .prepare(
          "UPDATE wedding_plans SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? AND EXISTS(SELECT 1 FROM wedding_invites WHERE id=? AND revoked=0 AND expires_at>?)",
        )
        .bind(
          JSON.stringify(next),
          now,
          invite.plan_id,
          p.revision,
          invite.id,
          now,
        )
        .run();
      if (result.meta.changes) {
        await db()
          .prepare("UPDATE wedding_invites SET last_submitted=? WHERE id=?")
          .bind(now, invite.id)
          .run();
        await audit(invite.plan_id, "Invited guest", "Updated an RSVP");
        return json({ ok: true, submittedAt: now });
      }
    }
    throw new HttpError(
      "The plan changed while saving. Please try again.",
      409,
    );
  } catch (e) {
    if (e instanceof z.ZodError)
      return json({ error: e.issues[0].message }, 400);
    return failure(e);
  }
}

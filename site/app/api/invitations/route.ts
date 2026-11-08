import { z } from "zod";
import { newInviteCode, codeHash } from "@/lib/server-invitations";
import { formatInviteCode } from "@/lib/guest-site";
import {
  context,
  db,
  readPlan,
  body,
  json,
  failure,
  HttpError,
  newToken,
  tokenHash,
  audit,
} from "@/lib/server-plan";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const c = await context(req);
    const rows = await db()
      .prepare(
        "SELECT id,guest_ids,expires_at,revoked,last_submitted FROM wedding_invites WHERE plan_id=? AND kind='rsvp' ORDER BY created_at DESC LIMIT 500",
      )
      .bind(c.plan)
      .all();
    return json({ invites: rows.results });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const c = await context(req);
    if (c.role === "viewer")
      throw new HttpError("You have read-only access.", 403);
    const input = z
      .object({ guestIds: z.array(z.string()).min(1).max(20) })
      .parse(await body(req));
    const plan = await readPlan(c.plan);
    const ids = [...new Set(input.guestIds)];
    if (
      ids.some(
        (id) => !plan.state.guests.some((g) => g.id === id && !g.archived),
      )
    )
      throw new HttpError("Choose active guests from this wedding.");
    const code = newInviteCode();
    const token = newToken(),
      id = crypto.randomUUID(),
      expires = new Date(
        Math.max(
          Date.now() + 90 * 86400000,
          Date.parse(
            (plan.state.settings.date || "1970-01-01") + "T12:00:00Z",
          ) +
            30 * 86400000,
        ),
      ).toISOString();
    await db()
      .prepare(
        "INSERT INTO wedding_invites (id,plan_id,kind,guest_ids,token_hash,expires_at,created_at,code_hash) VALUES (?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        c.plan,
        "rsvp",
        JSON.stringify(ids),
        await tokenHash(token),
        expires,
        new Date().toISOString(),
        await codeHash(c.plan, code),
      )
      .run();
    await audit(c.plan, c.email, "Created a guest RSVP link");
    return json({
      id,
      code: formatInviteCode(code),
      url: new URL("/rsvp", req.url).origin + "/rsvp#" + token,
      expires,
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return json({ error: e.issues[0].message }, 400);
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    const c = await context(req);
    if (c.role === "viewer")
      throw new HttpError("You have read-only access.", 403);
    const input = await body(req);
    await db()
      .prepare(
        "UPDATE wedding_invites SET revoked=1 WHERE id=? AND plan_id=? AND kind='rsvp'",
      )
      .bind(String(input.id), c.plan)
      .run();
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

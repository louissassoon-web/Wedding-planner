import { z } from "zod";
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
    const history = await db()
      .prepare(
        "SELECT actor,action,created_at FROM wedding_activity WHERE plan_id=? ORDER BY created_at DESC LIMIT 30",
      )
      .bind(c.plan)
      .all();
    const members = await db()
      .prepare(
        "SELECT id,email,role,joined_at FROM wedding_members WHERE plan_id=?",
      )
      .bind(c.plan)
      .all();
    const invites =
      c.role === "owner"
        ? await db()
            .prepare(
              "SELECT id,email,role,expires_at,accepted_by,revoked FROM wedding_invites WHERE plan_id=? AND kind='team' ORDER BY created_at DESC LIMIT 100",
            )
            .bind(c.plan)
            .all()
        : { results: [] };
    return json({
      members: members.results,
      invites: invites.results,
      history: history.results,
      role: c.role,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const c = await context(req);
    if (c.role !== "owner")
      throw new HttpError("Only the wedding owner can invite people.", 403);
    const input = z
      .object({
        email: z.string().trim().email().max(200),
        role: z.enum(["editor", "planner", "viewer"]),
      })
      .parse(await body(req));
    if (input.email.toLowerCase() === c.email)
      throw new HttpError("You already own this wedding.");
    const existing = await db()
      .prepare("SELECT id FROM wedding_members WHERE plan_id=? AND email=?")
      .bind(c.plan, input.email.toLowerCase())
      .first();
    if (existing)
      throw new HttpError(
        "This person already has access. Remove their current access before inviting them with a different role.",
      );
    const plan = await readPlan(c.plan);
    if (!plan.revision)
      throw new HttpError("Save your wedding details before inviting someone.");
    const token = newToken(),
      id = crypto.randomUUID(),
      expires = new Date(Date.now() + 7 * 86400000).toISOString();
    await db()
      .prepare(
        "INSERT INTO wedding_invites (id,plan_id,kind,email,role,token_hash,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        c.plan,
        "team",
        input.email.toLowerCase(),
        input.role,
        await tokenHash(token),
        expires,
        new Date().toISOString(),
      )
      .run();
    await audit(c.plan, c.email, "Created a team invitation");
    return json({
      id,
      url: new URL("/join", req.url).origin + "/join#" + token,
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
    if (c.role !== "owner")
      throw new HttpError("Only the wedding owner can change access.", 403);
    const input = z
      .object({ id: z.string(), kind: z.enum(["member", "invite"]) })
      .parse(await body(req));
    if (input.kind === "member") {
      await db().batch([
        db()
          .prepare(
            "UPDATE wedding_invites SET revoked=1 WHERE plan_id=? AND kind='team' AND (accepted_by=(SELECT user_id FROM wedding_members WHERE id=? AND plan_id=?) OR email=(SELECT email FROM wedding_members WHERE id=? AND plan_id=?))",
          )
          .bind(c.plan, input.id, c.plan, input.id, c.plan),
        db()
          .prepare("DELETE FROM wedding_members WHERE id=? AND plan_id=?")
          .bind(input.id, c.plan),
      ]);
    } else
      await db()
        .prepare(
          "UPDATE wedding_invites SET revoked=1 WHERE id=? AND plan_id=? AND kind='team'",
        )
        .bind(input.id, c.plan)
        .run();
    await audit(c.plan, c.email, "Revoked team access");
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

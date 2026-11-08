import {
  identity,
  body,
  db,
  json,
  failure,
  HttpError,
  tokenHash,
  audit,
} from "@/lib/server-plan";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const who = identity(req),
      input = await body(req),
      hash = await tokenHash(String(input.token || ""));
    const invite = await db()
      .prepare(
        "SELECT * FROM wedding_invites WHERE token_hash=? AND kind='team' AND revoked=0 AND expires_at>?",
      )
      .bind(hash, new Date().toISOString())
      .first<{
        id: string;
        plan_id: string;
        email: string;
        role: string;
        accepted_by: string | null;
      }>();
    if (!invite || (invite.accepted_by && invite.accepted_by !== who.user))
      throw new HttpError("This invitation has expired or was revoked.", 404);
    if (who.email !== invite.email)
      throw new HttpError(
        "Sign in with the email address this invitation was sent to.",
        403,
      );
    if (invite.plan_id === who.user)
      throw new HttpError("You already own this wedding.");
    if (invite.accepted_by) {
      const existing = await db()
        .prepare(
          "SELECT role FROM wedding_members WHERE plan_id=? AND user_id=?",
        )
        .bind(invite.plan_id, who.user)
        .first<{ role: string }>();
      if (!existing)
        throw new HttpError("This invitation has already been used.", 410);
      return json({ planId: invite.plan_id, role: existing.role });
    }
    const now = new Date().toISOString();
    await db().batch([
      db()
        .prepare(
          "INSERT INTO wedding_members (id,plan_id,user_id,email,role,joined_at) SELECT ?,plan_id,?,?,role,? FROM wedding_invites WHERE id=? AND revoked=0 AND expires_at>? AND (accepted_by IS NULL OR accepted_by=?) ON CONFLICT(id) DO NOTHING",
        )
        .bind(
          invite.plan_id + ":" + who.user,
          who.user,
          who.email,
          now,
          invite.id,
          now,
          who.user,
        ),
      db()
        .prepare(
          "UPDATE wedding_invites SET accepted_by=? WHERE id=? AND revoked=0 AND expires_at>? AND (accepted_by IS NULL OR accepted_by=?)",
        )
        .bind(who.user, invite.id, now, who.user),
    ]);
    const member = await db()
      .prepare("SELECT id FROM wedding_members WHERE id=?")
      .bind(invite.plan_id + ":" + who.user)
      .first();
    if (!member)
      throw new HttpError("This invitation is no longer available.", 409);
    await audit(invite.plan_id, who.email, "Joined the wedding team");
    return json({ planId: invite.plan_id, role: invite.role });
  } catch (e) {
    return failure(e);
  }
}

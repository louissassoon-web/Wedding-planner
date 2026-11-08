import { db, HttpError, tokenHash } from "./server-plan";
import { normaliseInviteCode } from "./guest-site";
export type RsvpInvitation = {
  id: string;
  plan_id: string;
  guest_ids: string;
  expires_at: string;
  last_submitted: string | null;
};
export function newInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...crypto.getRandomValues(new Uint8Array(12))]
    .map((n) => alphabet[n % 32])
    .join("");
}
export async function codeHash(plan: string, code: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(plan + ":" + normaliseInviteCode(code)),
      ),
    ),
  ]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export async function findRsvpInvitation(input: {
  token?: string;
  site?: string;
  code?: string;
}) {
  let invite: RsvpInvitation | null = null;
  if (input.token) {
    const hash = await tokenHash(input.token);
    invite = await db()
      .prepare(
        "SELECT id,plan_id,guest_ids,expires_at,last_submitted FROM wedding_invites WHERE token_hash=? AND kind='rsvp' AND revoked=0 AND expires_at>?",
      )
      .bind(hash, new Date().toISOString())
      .first<RsvpInvitation>();
  } else if (input.site && input.code) {
    const code = normaliseInviteCode(input.code);
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$/.test(code))
      throw new HttpError(
        "Check the invitation code printed on your invite.",
        404,
      );
    const site = await db()
      .prepare(
        "SELECT plan_id FROM wedding_guest_sites WHERE public_id=? AND enabled=1",
      )
      .bind(input.site)
      .first<{ plan_id: string }>();
    if (site)
      invite = await db()
        .prepare(
          "SELECT id,plan_id,guest_ids,expires_at,last_submitted FROM wedding_invites WHERE plan_id=? AND code_hash=? AND kind='rsvp' AND revoked=0 AND expires_at>?",
        )
        .bind(
          site.plan_id,
          await codeHash(site.plan_id, code),
          new Date().toISOString(),
        )
        .first<RsvpInvitation>();
  }
  if (!invite)
    throw new HttpError(
      "This invitation is unavailable. Check your link or invitation code, or contact the couple.",
      404,
    );
  return invite;
}

import { z } from "zod";
import {
  context,
  db,
  readPlan,
  body,
  json,
  failure,
  HttpError,
  audit,
} from "@/lib/server-plan";
import { publicWedding } from "@/lib/guest-site";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const c = await context(req);
    const p = await readPlan(c.plan);
    const site = await db()
      .prepare(
        "SELECT public_id,enabled FROM wedding_guest_sites WHERE plan_id=?",
      )
      .bind(c.plan)
      .first<{ public_id: string; enabled: number }>();
    return json({
      wedding: publicWedding(p.state),
      site: site
        ? {
            url: new URL("/wedding/" + site.public_id, req.url).href,
            enabled: !!site.enabled,
          }
        : null,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const c = await context(req);
    if (c.role !== "owner" && c.role !== "editor")
      throw new HttpError(
        "Only the wedding owner and full editors can publish guest details.",
        403,
      );
    const input = z.object({ enabled: z.boolean() }).parse(await body(req));
    const p = await readPlan(c.plan);
    if (!p.revision) throw new HttpError("Save your wedding details first.");
    const publicId = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("");
    await db()
      .prepare(
        "INSERT INTO wedding_guest_sites (plan_id,public_id,enabled,updated_at) VALUES (?,?,?,?) ON CONFLICT(plan_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at",
      )
      .bind(c.plan, publicId, input.enabled ? 1 : 0, new Date().toISOString())
      .run();
    await audit(
      c.plan,
      c.email,
      input.enabled
        ? "Published the guest website"
        : "Paused the guest website",
    );
    return GET(req);
  } catch (e) {
    if (e instanceof z.ZodError)
      return json({ error: e.issues[0].message }, 400);
    return failure(e);
  }
}

import { stateSchema } from "@/lib/planner";
import { visiblePlan, permittedUpdate, type Role } from "@/lib/access";
import {
  context,
  db,
  readPlan,
  writePlan,
  json,
  body,
  failure,
  HttpError,
  audit,
} from "@/lib/server-plan";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const c = await context(req),
      p = await readPlan(c.plan);
    const shared = await db()
      .prepare(
        "SELECT m.plan_id,m.role,p.data FROM wedding_members m JOIN wedding_plans p ON p.user_id=m.plan_id WHERE m.user_id=?",
      )
      .bind(c.user)
      .all<{ plan_id: string; role: Role; data: string }>();
    const plans = [
      { id: c.user, name: "My wedding", role: "owner" },
      ...shared.results.map((x) => ({
        id: x.plan_id,
        name: JSON.parse(x.data).settings.name,
        role: x.role,
      })),
    ];
    return json({
      ...p,
      state: visiblePlan(p.state, c.role),
      planId: c.plan,
      role: c.role,
      plans,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    const c = await context(req);
    if (c.role === "viewer")
      throw new HttpError("You have read-only access.", 403);
    const input = await body(req);
    if (!Number.isInteger(input.revision) || input.revision < 0)
      throw new HttpError("Invalid revision");
    const parsed = stateSchema.safeParse(input.state);
    if (!parsed.success) throw new HttpError(parsed.error.issues[0].message);
    const current = await readPlan(c.plan);
    let next;
    try {
      next = permittedUpdate(current.state, parsed.data, c.role);
    } catch (e) {
      throw new HttpError((e as Error).message, 403);
    }
    if (next.documents.some((d) => !d.key.startsWith(c.plan + "/")))
      throw new HttpError("Invalid document owner", 403);
    if (!(await writePlan(c.plan, next, input.revision)))
      throw new HttpError(
        "Your plan changed in another tab or someone replied. Reload the latest version before saving again.",
        409,
      );
    await audit(c.plan, c.email || "Team member", "Updated the wedding plan");
    return json({ revision: input.revision + 1 });
  } catch (e) {
    return failure(e);
  }
}

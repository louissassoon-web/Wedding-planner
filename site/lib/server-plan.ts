import { env } from "cloudflare:workers";
import { emptyState, stateSchema, type PlannerState } from "./planner";
import type { Role } from "./access";
export const db = () => env.DB!;
export const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function identity(req: Request) {
  const user = req.headers.get("oai-authenticated-user-id");
  if (!user) throw new HttpError("Please sign in to open your planner.", 401);
  return {
    user,
    email: (req.headers.get("oai-authenticated-user-email") || "")
      .trim()
      .toLowerCase(),
  };
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    throw new HttpError("Invalid origin", 403);
}
export async function body(req: Request) {
  checkOrigin(req);
  const raw = await req.text();
  if (raw.length > 2000000)
    throw new HttpError("The request is too large", 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError("Invalid request");
  }
}
export async function context(req: Request) {
  const who = identity(req);
  const plan = new URL(req.url).searchParams.get("plan") || who.user;
  let role: Role = "owner";
  if (plan !== who.user) {
    const membership = await db()
      .prepare("SELECT role FROM wedding_members WHERE plan_id=? AND user_id=?")
      .bind(plan, who.user)
      .first<{ role: Role }>();
    if (!membership)
      throw new HttpError("You do not have access to this wedding.", 403);
    role = membership.role;
  }
  return { ...who, plan, role };
}
export async function readPlan(plan: string) {
  const row = await db()
    .prepare("SELECT data,revision FROM wedding_plans WHERE user_id=?")
    .bind(plan)
    .first<{ data: string; revision: number }>();
  return {
    state: row ? stateSchema.parse(JSON.parse(row.data)) : emptyState(),
    revision: row?.revision ?? 0,
  };
}
export async function writePlan(
  plan: string,
  state: PlannerState,
  revision: number,
) {
  const data = JSON.stringify(state),
    now = new Date().toISOString();
  const result =
    revision === 0
      ? await db()
          .prepare(
            "INSERT INTO wedding_plans (user_id,data,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING",
          )
          .bind(plan, data, now)
          .run()
      : await db()
          .prepare(
            "UPDATE wedding_plans SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?",
          )
          .bind(data, now, plan, revision)
          .run();
  return !!result.meta.changes;
}
export async function audit(plan: string, actor: string, action: string) {
  try {
    await db()
      .prepare(
        "INSERT INTO wedding_activity (id,plan_id,actor,action,created_at) VALUES (?,?,?,?,?)",
      )
      .bind(crypto.randomUUID(), plan, actor, action, new Date().toISOString())
      .run();
  } catch {
    console.warn("Activity record could not be written");
  }
}
export async function tokenHash(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new HttpError("This link is invalid or has expired.", 404);
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function newToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  return json(
    { error: "Unable to complete this action. Please try again." },
    500,
  );
}

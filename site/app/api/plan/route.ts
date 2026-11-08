import { env } from "cloudflare:workers";
import { emptyState, stateSchema } from "@/lib/planner";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id");
  if (!user)
    return json({ error: "Please sign in to open your planner." }, 401);
  const row = await env
    .DB!.prepare("SELECT data, revision FROM wedding_plans WHERE user_id = ?")
    .bind(user)
    .first<{ data: string; revision: number }>();
  return json({
    state: row ? JSON.parse(row.data) : emptyState(),
    revision: row?.revision ?? 0,
  });
}
export async function PUT(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id");
  if (!user)
    return json({ error: "Please sign in to save your planner." }, 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return json({ error: "Invalid origin" }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 2000000)
      return json({ error: "This planner is too large to save." }, 413);
    const body = JSON.parse(raw);
    const parsed = stateSchema.safeParse(body.state);
    if (!parsed.success)
      return json({ error: parsed.error.issues[0].message }, 400);
    if (!Number.isInteger(body.revision) || body.revision < 0)
      return json({ error: "Invalid revision" }, 400);
    if (parsed.data.documents.some((d) => !d.key.startsWith(user + "/")))
      return json({ error: "Invalid document owner" }, 403);
    const result =
      body.revision === 0
        ? await env
            .DB!.prepare(
              "INSERT INTO wedding_plans (user_id,data,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING",
            )
            .bind(user, JSON.stringify(parsed.data), new Date().toISOString())
            .run()
        : await env
            .DB!.prepare(
              "UPDATE wedding_plans SET data = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?",
            )
            .bind(
              JSON.stringify(parsed.data),
              new Date().toISOString(),
              user,
              body.revision,
            )
            .run();
    if (!result.meta.changes)
      return json(
        {
          error:
            "Your plan changed in another tab. Reload the latest version before trying again.",
        },
        409,
      );
    return json({ revision: body.revision + 1 });
  } catch {
    return json(
      { error: "Unable to save. Check the details and try again." },
      400,
    );
  }
}

import { env } from "cloudflare:workers";
import type { PlannerState } from "@/lib/planner";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id");
  if (!user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const length = Number(request.headers.get("content-length"));
  if (length > 11 * 1024 * 1024)
    return Response.json(
      { error: "Files must be under 10 MB." },
      { status: 413 },
    );
  const form = await request.formData();
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    file.size > 10 * 1024 * 1024 ||
    file.size === 0
  )
    return Response.json(
      { error: "Choose a non-empty file under 10 MB." },
      { status: 400 },
    );
  const id = crypto.randomUUID(),
    key = user + "/" + id;
  await env.BUCKET!.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: "application/octet-stream" },
  });
  return Response.json({
    id,
    key,
    name: file.name.slice(0, 200),
    size: file.size,
    type: file.type.slice(0, 200),
    folder: String(form.get("folder") || "General").slice(0, 200),
    archived: false,
  });
}
export async function GET(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id");
  if (!user) return new Response("Please sign in", { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  const row = await env
    .DB!.prepare("SELECT data FROM wedding_plans WHERE user_id = ?")
    .bind(user)
    .first<{ data: string }>();
  const doc =
    row &&
    (JSON.parse(row.data) as PlannerState).documents.find(
      (d) => d.id === id && !d.archived,
    );
  if (!doc || !doc.key.startsWith(user + "/"))
    return new Response("Not found", { status: 404 });
  const file = await env.BUCKET!.get(doc.key);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

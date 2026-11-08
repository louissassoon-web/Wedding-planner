import {
  db,
  readPlan,
  body,
  json,
  failure,
  HttpError,
} from "@/lib/server-plan";
import { publicWedding } from "@/lib/guest-site";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const input = await body(req);
    if (!/^[a-f0-9]{32}$/.test(String(input.site)))
      throw new HttpError(
        "This wedding page is unavailable. Please check your invitation link.",
        404,
      );
    const site = await db()
      .prepare(
        "SELECT plan_id FROM wedding_guest_sites WHERE public_id=? AND enabled=1",
      )
      .bind(input.site)
      .first<{ plan_id: string }>();
    if (!site)
      throw new HttpError(
        "This wedding page is unavailable. Please contact the couple.",
        404,
      );
    const p = await readPlan(site.plan_id);
    return json({ wedding: publicWedding(p.state) });
  } catch (e) {
    return failure(e);
  }
}

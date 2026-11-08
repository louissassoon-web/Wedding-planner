# Our Wedding

A calm, private wedding planner with real saved tasks, guests, budgets, suppliers, seating, documents and timelines.

Hosted privately at https://our-wedding-planner.workspace-710372.chatgpt.site (ChatGPT sign-in required).

See [the product review and Reddit research](docs/product-review.md) for the original app audit, implemented improvements and next priorities.

## Architecture

The prototype's disconnected Next.js/React screens have been replaced with a Next-compatible Vinext application on Cloudflare Workers. D1 stores each authenticated user's plan; R2 stores private documents. Sites supplies sign-in and hosting access control. The original prototype remains in Git history.

- `components/planner.tsx`: client workspace and forms
- `lib/planner.ts`: schemas, calculations, CSV handling and optional sample/checklist
- `app/api/plan/route.ts`: authenticated, validated saves with revision conflict protection
- `app/api/documents/route.ts`: authenticated uploads and owner-checked downloads
- `db/schema.ts` and `drizzle/`: D1 schema and migration
- `.openai/hosting.json`: Site identity and DB/BUCKET bindings

There is no local-storage fallback for user records and no hard-coded production test user. Shared editing between accounts is not yet implemented. Each visitor's plan is scoped to their Site user ID.

## Development

Node 22.13+ is required. `npm ci` installs the pinned dependencies; `npm run dev` starts the portable preview on loopback. Local sign-in is simulated only in development at `/signin-with-chatgpt?return_to=/`. Production authentication is provided by Sites and the mock is excluded from the production build.

For a fresh checkout:

1. Install dependencies: `npm ci`.
2. Build the local Worker configuration: `npm run build`.
3. Apply the schema locally:
   `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_volatile_black_knight.sql`
4. Start `npm run dev` and use the printed local URL.

Local records and uploaded files live in ignored `.wrangler/` state. Do not commit that directory or local secrets. Production storage is separate. Applied migrations must remain immutable; generate new migrations for future schema changes.

## Checks

- `npm test` — data rules and calculations (Node 22.18+ or Node 24+ for built-in TypeScript stripping)
- `npm run typecheck` — TypeScript
- `npm run build` — production build
- `npm run test:api` — local-only smoke test; requires the preview on port 5173 and the local migration. The script restores planner data after successful checks and leaves an unreferenced disposable local upload.

## Publishing

Use the Sites skill's source/build/package workflow and private deployment for the project in `.openai/hosting.json`. A GitHub push alone does not deploy this Site. Do not change the Site audience just to deploy. Generated `dist/`, dependency trees and local databases are ignored.

Exported JSON includes planning records and document metadata, not document bytes. Download attachments separately. Guest RSVPs are manually recorded; in-app reminders do not send email or push notifications.

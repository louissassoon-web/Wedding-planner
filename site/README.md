# Our Wedding

A calm, private wedding planner with real saved tasks, guests, budgets, suppliers, seating, documents and timelines.

Hosted at https://our-wedding-planner.workspace-710372.chatgpt.site. Planner records require ChatGPT sign-in and wedding membership; RSVP pages require a private invitation token. The Sites audience is managed separately and must allow visitors for external invitation links to work.

See [the product review and Reddit research](docs/product-review.md) for the original app audit, implemented improvements and next priorities.

## Architecture

The prototype's disconnected Next.js/React screens have been replaced with a Next-compatible Vinext application on Cloudflare Workers. D1 stores wedding plans, memberships, hashed invitations and an activity log; R2 stores private documents. Sites supplies sign-in and hosting access control. The original prototype remains in Git history.

- `components/planner.tsx`: client workspace and forms
- `lib/planner.ts`: schemas, calculations, CSV handling and optional sample/checklist
- `app/api/plan/route.ts`: authenticated, validated saves with revision conflict protection
- `app/api/documents/route.ts`: authenticated uploads and owner-checked downloads
- `db/schema.ts` and `drizzle/`: D1 schema and migration
- `.openai/hosting.json`: Site identity and DB/BUCKET bindings

There is no local-storage fallback for user records and no hard-coded production test user. Local storage holds only the selected wedding ID; session storage holds only an explicitly opened fictional sample. Owners invite full editors, logistics planners (no budget/documents), or read-only viewers. Every API enforces membership and role checks. Planner writes use revision compare-and-swap. Guest replies merge only the invited guests’ RSVP, meal and dietary fields into the latest plan. Raw invitation tokens are shown once and stored only as SHA-256 hashes on the server.

## Development

Node 22.13+ is required. `npm ci` installs the pinned dependencies; `npm run dev` starts the portable preview on loopback. Local sign-in is simulated only in development at `/signin-with-chatgpt?return_to=/`. Production authentication is provided by Sites and the mock is excluded from the production build.

For a fresh checkout:

1. Install dependencies: `npm ci`.
2. Build the local Worker configuration: `npm run build`.
3. Apply each SQL migration in `drizzle/` in order to the local database, using:
   `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file <migration.sql>`
4. Start `npm run dev` and use the printed local URL.

Local records and uploaded files live in ignored `.wrangler/` state. Do not commit that directory or local secrets. Production storage is separate. Applied migrations must remain immutable; generate new migrations for future schema changes.

## Checks

- `npm test` — data rules and calculations (Node 22.18+ or Node 24+ for built-in TypeScript stripping)
- `npm run typecheck` — TypeScript
- `npm run build` — production build
- `npm run test:api` — local-only smoke test; requires the preview on port 5173 and the local migration. The script restores planner data after successful checks and leaves an unreferenced disposable local upload.

## Publishing

Use the Sites skill’s source/build/package workflow and the deployment operation appropriate for the current audience of the project in `.openai/hosting.json`. A GitHub push alone does not deploy this Site. Do not change the Site audience just to deploy. Generated `dist/`, dependency trees and local databases are ignored.

Exported JSON includes planning records and document metadata, not document bytes. Download attachments separately. Guests can reply through household-specific links, or the couple can record replies manually. Payment schedules retain earlier paid totals, support due dates and receipt references, and export `.ics` calendars with 7-day and 1-day alarms. The calendar is a snapshot: re-export and replace the prior import after changes. The app does not send emails or process payments.

## Follow-up integration checks

`node tests/features-api.mjs` runs against a disposable built local Worker on `127.0.0.1:8788`, with the migrations applied to its separate `.wrangler/feature-tests` state. It emulates Sites identity headers on loopback only; never point it at production. Checks include every role, membership revocation, email-bound invitation acceptance, scoped document access, household RSVP isolation, forbidden field injection, guest-seat changes, origin checks and concurrent save conflicts.

Navigation intentionally uses normal anchors: the production Vinext client-link handler previously threw on navigation even though development navigation worked. Sample mode survives these full-page navigations in session storage.

# Wedding Planner

The improved hosted wedding planner lives in [`site/`](site/README.md).

**[Open the live app](https://our-wedding-planner.workspace-710372.chatgpt.site)** — wedding plans require ChatGPT sign-in.

It adds persistent private storage, a responsive redesign, shared planning roles and invitations, household RSVP links, payment instalments and calendar reminders, supplier records, seating assignments, timelines, file uploads, CSV exports and reversible archiving. All navigation uses normal page links after fixing a production client-routing failure.

The site hosting audience is controlled separately. Guest and collaborator links work externally when visitors are allowed; server-side sign-in, membership and invitation checks continue to protect wedding data.

Read the [product review and Reddit research](site/docs/product-review.md) for the original feature audit, changes made and recommended next improvements.

## Run the hosted version locally

Follow [`site/README.md`](site/README.md). Start commands from the `site/` directory; the root scripts still run the original prototype.

## Original prototype

The original `src/`, `prisma/` schema and root configuration are preserved for reference. Its interface uses temporary component state and is not the deployed app. Its legacy demo login is `demo@wedding.com` / `demo123`, requiring the separately configured original database. Do not use those demo credentials for the hosted planner.

# Wedding Planner

The improved, privately hosted wedding planner lives in [`site/`](site/README.md).

**[Open the live app](https://our-wedding-planner.workspace-710372.chatgpt.site)** — sign in with ChatGPT.

It adds persistent private storage, a responsive redesign, working guest/meal/RSVP tracking, payment balances, supplier records, seating assignments, timelines, file uploads, CSV exports and reversible archiving.

Read the [product review and Reddit research](site/docs/product-review.md) for the original feature audit, changes made and recommended next improvements.

## Run the hosted version locally

Follow [`site/README.md`](site/README.md). Start commands from the `site/` directory; the root scripts still run the original prototype.

## Original prototype

The original `src/`, `prisma/` schema and root configuration are preserved for reference. Its interface uses temporary component state and is not the deployed app. Its legacy demo login is `demo@wedding.com` / `demo123`, requiring the separately configured original database. Do not use those demo credentials for the hosted planner.

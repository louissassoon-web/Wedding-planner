# Wedding Planner review · 8 November 2026

## What the original app did

The repository offered a Next.js interface for a dashboard, tasks, guests, budget, vendors, seating, timeline, documents, notifications and settings. It had a coherent blush/sage palette, serif headings, UK currency formatting, and a comprehensive Prisma schema for an eventual MySQL service.

The working parts were mostly in-memory interactions: adding tasks, guests, suppliers, expenses and tables; toggling checklist items; filtering records; and recording a guest's RSVP. They were lost when the screen remounted or refreshed. The dashboard's 12/45 tasks and 478-day countdown did not reflect those records. The supplied wedding date was also hard-coded.

The database schema was not connected to planner CRUD. Several visible controls did nothing: editing records, recording payments, assigning seats, uploading/downloading documents, saving settings and team permissions. The login depended on a separately configured MySQL database and did not protect dashboard routes. The original marketing page described permissions and reminders that were not enforced or sent.

## Reddit evidence and product decisions

These are qualitative reports, not a representative survey or a verified current feature inventory. Opinions differ, and some threads contain product promotion; promotional replies were not treated as independent evidence. No market-share ranking is implied by “main apps”.

| Apps discussed | What couples reported | Decision for this app |
| --- | --- | --- |
| Zola / The Knot / WeddingWire | Couples value a pleasant UI, integrated guest lists and reliable budgets. A September 2025 discussion includes complaints about upselling, glitches and a budget-tool change during planning. | Prioritise dependable core workflows, real totals and exportability before adding discovery or marketing features. |
| With Joy / Zola / Minted | A July 2025 discussion reports mixed views on Joy's navigation and guest list, and a need for flexible meal/dietary questions. Other users preferred The Knot or Minted. | Keep guest editing direct; keep RSVP, meal choice and dietary notes together, with one person per row. |
| Bridebook / Hitched | A UK thread praises editable checklists and budgets, while another user abandoned an app because of too many irrelevant tasks. Several prefer Google Sheets. | Offer an optional short starter checklist, editable owners/dates, reversible archiving and CSV import/export. |
| Zola / spreadsheets | A budget thread values payment dates and sees spreadsheet flexibility as important. | Separate estimates, agreed costs, paid amounts and remaining balances. Surface deadlines on the dashboard. |
| Hitched | An August 2026 thread describes restrictive menu choices and dietary information becoming scattered across emails. | Store meal and dietary details alongside each guest, and include them in seating/guest exports. |

Sources:

- [Best wedding planning site? · September 2025](https://www.reddit.com/r/weddingplanning/comments/1nscotu/best_wedding_planning_site/)
- [Wedding website complaints, mainly With Joy · July 2025](https://www.reddit.com/r/weddingplanning/comments/1mcb2y6/)
- [Wedding planning apps · UKweddings, June 2025](https://www.reddit.com/r/UKweddings/comments/1lb3rp9/wedding_planning_apps/)
- [Budget trackers? · September 2025](https://www.reddit.com/r/weddingplanning/comments/1ne99s9/budget_trackers/)
- [Finding glitches with Hitched · August 2026](https://www.reddit.com/r/UKweddings/comments/1vo430a/finding_glitches_with_hitched/)
- [Wedding organisation · March 2025](https://www.reddit.com/r/weddingplanning/comments/1j2q5a0/)

## Implemented

- Private ChatGPT sign-in and user-scoped D1 persistence. No demo password or public write endpoint. Saves reject stale revisions instead of silently overwriting another tab.
- A warm ivory/forest/sage design retaining the original calm, wedding-specific character. Responsive sidebar/menu, focused overview, larger contrast-safe secondary text, phone-friendly guest/expense cards, labelled controls and focus-managed dialogs.
- Dashboard totals and countdown derived from saved records and actual date; next tasks and payment balances link directly to editing.
- Editable tasks with owners, categories, priorities, due dates, completion and optional starter checklist. Adding a checklist does not make suggested tasks overdue immediately. Changing the wedding date does not silently reschedule existing commitments.
- Guests with households, manual RSVPs, meal choices, dietary notes, CSV import preview, duplicate detection and CSV exports protected against spreadsheet formula injection. Plus-ones are named guest rows, avoiding double counts.
- Budget estimates, nullable agreed prices (including genuinely free items), total paid, due dates and supplier links. Forecast uses agreed costs when present and estimates otherwise. Validation rejects overpayments and negative amounts.
- Supplier contact details, notes and booking stages.
- Capacity-checked seating tied to confirmed guests. Declining or archiving a seated guest frees their seat. Archiving a table unassigns its guests.
- Editable event timeline with dates, times, location and responsible person; export for suppliers.
- Real private document upload/download with a 10 MB limit. Documents are checked against the signed-in user's plan and downloaded as attachments.
- Reversible archiving, a JSON data export, in-app reminders, and a clearly labelled sample that never saves over a real wedding.

## Recommended next

1. **Shared couple/planner workspace.** Add explicit membership and role-based authorisation, invitations, an activity log and safe concurrent editing. Task ownership currently organises work; it does not give another account access. Do not share passwords.
2. **Guest-facing RSVP collection.** A simple invitation-specific link, household confirmation, per-event attendance, editable replies, meal courses and contact collection. Keep the private planner inaccessible to guests.
3. **Payment instalments and reminders.** Replace aggregate paid totals with a ledger of deposits, instalments, due dates and receipts; offer opt-in email/calendar reminders and delivery tracking.
4. **Backup restore and better handoffs.** Add a validated restore preview, printable catering/table packs, and an iCalendar timeline. The current JSON export contains records and document metadata, not document bytes.
5. **Richer planning only after the above.** Multi-day events with per-event guest eligibility, checklist templates chosen by wedding type/region, and a seating floor plan with keyboard alternatives. Avoid an overwhelming default checklist or paid-supplier marketplace.

## Verification and limits

Automated tests cover budgets, invalid values/dates, guest CSV escaping/parsing, seating constraints, checklist dates and duplicate IDs. Local API smoke tests cover sign-in, persistence, stale-write rejection, origin checks, document ownership and upload/download. Browser checks cover setup, saved dates, task completion surviving refresh, guest replies and meal fields, budget calculations, seating assignments, and phone navigation/layout.

The deployed app is intentionally private and starts empty. Local test records are not deployed. Existing prototype records were in component memory; no external MySQL data was supplied or migrated. Notifications are visible inside the app only. There is no outbound email, guest self-service RSVP, multi-user shared planner, registry, payment processing, or vendor discovery service in this release.

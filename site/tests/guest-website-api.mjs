import assert from "node:assert/strict";
import { emptyState, guestSchema } from "../lib/planner.ts";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:8788";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))
  throw Error("Local Worker only");
const run = Date.now().toString(36),
  owner = "guest-site-owner-" + run,
  other = "other-owner-" + run;
async function call(path, who = owner, method = "GET", body, expected = 200) {
  const r = await fetch(origin + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(who
        ? {
            "oai-authenticated-user-id": who,
            "oai-authenticated-user-email": who + "@example.test",
          }
        : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const d = await r.json();
  assert.equal(r.status, expected, `${path}: ${JSON.stringify(d)}`);
  return d;
}
const s = emptyState();
s.settings.name = "Website test wedding";
s.settings.date = "2027-09-04";
s.settings.rsvpDeadline = "2027-09-04";
s.settings.budget = 23000;
s.guestSite.contactEmail = "couple@example.test";
s.guestSite.mealOptions = ["Vegetarian", "Chicken"];
s.guestSite.askTransport = true;
s.guests = ["One", "Two", "Private"].map((name, i) =>
  guestSchema.parse({
    id: "guest-" + i,
    name,
    email: "private@example.test",
    group: "Friends",
    household: "Household",
    rsvp: "pending",
    meal: "",
    dietary: "",
    table: "",
    notes: "Planning only",
    archived: false,
  }),
);
await call("/api/plan", owner, "PUT", { state: s, revision: 0 });
await call("/api/guest-site", null, "GET", undefined, 401);
const published = await call("/api/guest-site", owner, "POST", {
  enabled: true,
});
const site = published.site.url.split("/").pop();
const publicData = await call("/api/wedding", null, "POST", { site });
assert.equal(publicData.wedding.deadline, "2027-05-15");
assert.equal(publicData.wedding.details.contactEmail, "couple@example.test");
assert.equal(publicData.wedding.guests, undefined);
assert.equal(publicData.wedding.budget, undefined);
assert.equal(publicData.wedding.expenses, undefined);
const inv = await call("/api/invitations", owner, "POST", {
  guestIds: ["guest-0", "guest-1"],
});
assert.match(inv.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
const token = inv.url.split("#")[1];
const auth = { site, code: inv.code.toLowerCase().replaceAll("-", " ") };
const opened = await call("/api/rsvp", null, "POST", {
  ...auth,
  action: "read",
});
assert.deepEqual(
  opened.guests.map((g) => g.name),
  ["One", "Two"],
);
assert.equal(opened.guests[0].email, undefined);
assert.equal(opened.guests[0].notes, undefined);
await call(
  "/api/rsvp",
  null,
  "POST",
  { site, code: "WRONG-CODE", action: "read" },
  404,
);
await call("/api/plan", other, "PUT", { state: emptyState(), revision: 0 });
const otherSite = (
  await call("/api/guest-site", other, "POST", { enabled: true })
).site.url
  .split("/")
  .pop();
await call(
  "/api/rsvp",
  null,
  "POST",
  { site: otherSite, code: inv.code, action: "read" },
  404,
);
const reply = (id) => ({
  id,
  rsvp: "confirmed",
  meal: "Vegetarian",
  dietary: "Nut allergy",
  accessibility: "Step-free entrance, please",
  transport: "yes",
  songRequest: "A favourite song",
  message: "Can’t wait!",
  replyEmail: "guest@example.test",
  replyPhone: "01234 567890",
});
await call(
  "/api/rsvp",
  null,
  "POST",
  {
    ...auth,
    action: "respond",
    guests: [{ ...reply("guest-0"), notes: "No" }, reply("guest-1")],
  },
  400,
);
await call(
  "/api/rsvp",
  null,
  "POST",
  {
    ...auth,
    action: "respond",
    guests: [{ ...reply("guest-0"), replyEmail: "invalid" }, reply("guest-1")],
  },
  400,
);
await call(
  "/api/rsvp",
  null,
  "POST",
  {
    ...auth,
    action: "respond",
    guests: [{ ...reply("guest-0"), meal: "Unknown meal" }, reply("guest-1")],
  },
  400,
);
await call("/api/rsvp", null, "POST", {
  ...auth,
  action: "respond",
  guests: [reply("guest-0"), reply("guest-1")],
});
const saved = await call("/api/plan");
assert.equal(saved.state.guests[0].accessibility, "Step-free entrance, please");
assert.equal(saved.state.guests[0].songRequest, "A favourite song");
assert.equal(saved.state.guests[0].email, "private@example.test");
assert.equal(saved.state.guests[0].notes, "Planning only");
assert.equal(saved.state.guests[2].rsvp, "pending");
assert.equal(saved.state.settings.budget, 23000);
const tokenRead = await call("/api/rsvp", null, "POST", {
  token,
  action: "read",
});
assert.equal(tokenRead.guests[0].replyEmail, "guest@example.test");
await call("/api/guest-site", owner, "POST", { enabled: false });
await call("/api/wedding", null, "POST", { site }, 404);
await call("/api/rsvp", null, "POST", { ...auth, action: "read" }, 404);
await call("/api/rsvp", null, "POST", { token, action: "read" });
const resumed = await call("/api/guest-site", owner, "POST", { enabled: true });
assert.equal(resumed.site.url, published.site.url);
await call("/api/invitations", owner, "DELETE", { id: inv.id });
await call("/api/rsvp", null, "POST", { ...auth, action: "read" }, 404);
await call("/api/rsvp", null, "POST", { token, action: "read" }, 404);
console.log(
  "Guest website API checks passed: safe publication, household codes, cross-wedding isolation, full guest replies, validation, private-data preservation, pause/resume, revoked codes, and legacy personal links.",
);

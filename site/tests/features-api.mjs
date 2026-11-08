// Integration checks against a disposable local Worker. The test headers stand
// in for Sites' trusted identity injection; never run this against a hosted site.
import assert from "node:assert/strict";
import { emptyState } from "../lib/planner.ts";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:8788";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))
  throw Error("Local Worker only");
const run = Date.now().toString(36);
const owner = { id: "owner-" + run, email: "owner@example.test" },
  editor = { id: "editor-" + run, email: "editor@example.test" },
  viewer = { id: "viewer-" + run, email: "viewer@example.test" },
  planner = { id: "planner-" + run, email: "planner@example.test" };
const path = (route) => route + "?plan=" + owner.id;
const auth = (who) =>
  who
    ? {
        "oai-authenticated-user-id": who.id,
        "oai-authenticated-user-email": who.email,
      }
    : {};
async function call(
  route,
  who = owner,
  method = "GET",
  data,
  expected = 200,
  extra = {},
) {
  const r = await fetch(origin + route, {
    method,
    headers: { ...auth(who), "Content-Type": "application/json", ...extra },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await r.json();
  assert.equal(
    r.status,
    expected,
    `${method} ${route}: ${JSON.stringify(result)}`,
  );
  return result;
}
assert.equal((await fetch(origin + "/api/plan")).status, 401);
let s = emptyState();
s.settings.name = "Feature test wedding";
s.settings.date = "2030-06-15";
s.settings.budget = 20000;
s.tables = [{ id: "table", name: "Garden", capacity: 8, archived: false }];
const guest = (id, name) => ({
  id,
  name,
  email: "private@example.test",
  group: "Friends",
  household: "Test household",
  rsvp: "confirmed",
  meal: "Vegetarian",
  dietary: "",
  table: "table",
  notes: "private planning note",
  archived: false,
});
s.guests = [
  guest("g1", "First guest"),
  guest("g2", "Second guest"),
  guest("g3", "Not invited"),
];
s.expenses = [
  {
    id: "venue",
    name: "Venue",
    category: "Venue",
    estimate: 6000,
    actual: 6500,
    paid: 1000,
    due: "2030-05-01",
    vendor: "",
    notes: "private cost",
    archived: false,
  },
];
let saved = await call("/api/plan", owner, "PUT", { state: s, revision: 0 });
assert.equal(saved.revision, 1);
await call(path("/api/plan"), editor, "GET", undefined, 403);
await call("/api/plan", owner, "PUT", { state: s, revision: 1 }, 403, {
  Origin: "https://bad.example",
});
const uploadForm = new FormData();
uploadForm.set(
  "file",
  new File(["private document"], "receipt.txt", { type: "text/plain" }),
);
const upload = await fetch(origin + "/api/documents", {
  method: "POST",
  headers: auth(owner),
  body: uploadForm,
});
assert.equal(upload.status, 200);
const doc = await upload.json();
s.documents = [doc];
await call("/api/plan", owner, "PUT", { state: s, revision: 1 });
async function invite(who, role) {
  const inv = await call("/api/team", owner, "POST", {
    email: who.email,
    role,
  });
  const token = new URL(inv.url).hash.slice(1);
  await call("/api/join", who, "POST", { token });
  return { inv, token };
}
const ei = await invite(editor, "editor");
await call("/api/join", viewer, "POST", { token: ei.token }, 404);
let shared = await call(path("/api/plan"), editor);
assert.equal(shared.role, "editor");
assert.ok(shared.plans.some((p) => p.id === owner.id));
shared.state.tasks.push({
  id: "shared-task",
  title: "Book music",
  due: "2030-03-01",
  category: "Music",
  owner: "Together",
  priority: "medium",
  done: false,
  notes: "",
  archived: false,
});
await call(path("/api/plan"), editor, "PUT", {
  state: shared.state,
  revision: shared.revision,
});
await call(
  path("/api/team"),
  editor,
  "POST",
  { email: "someone@example.test", role: "editor" },
  403,
);
await invite(viewer, "viewer");
let view = await call(path("/api/plan"), viewer);
assert.equal(view.state.settings.budget, 20000);
await call(
  path("/api/plan"),
  viewer,
  "PUT",
  { state: view.state, revision: view.revision },
  403,
);
await call(path("/api/invitations"), viewer, "POST", { guestIds: ["g1"] }, 403);
assert.equal(
  (
    await fetch(origin + path("/api/documents") + "&id=" + doc.id, {
      headers: auth(viewer),
    })
  ).status,
  200,
);
await invite(planner, "planner");
let logistics = await call(path("/api/plan"), planner);
assert.equal(logistics.state.settings.budget, 0);
assert.deepEqual(logistics.state.expenses, []);
assert.deepEqual(logistics.state.documents, []);
assert.equal(
  (
    await fetch(origin + path("/api/documents") + "&id=" + doc.id, {
      headers: auth(planner),
    })
  ).status,
  403,
);
logistics.state.tasks[0].done = true;
await call(path("/api/plan"), planner, "PUT", {
  state: logistics.state,
  revision: logistics.revision,
});
let current = await call("/api/plan");
assert.equal(current.state.settings.budget, 20000);
assert.equal(current.state.expenses[0].paid, 1000);
assert.equal(current.state.documents.length, 1);
assert.equal(current.state.tasks[0].done, true);
const gi = await call("/api/invitations", owner, "POST", {
  guestIds: ["g1", "g2"],
});
const token = new URL(gi.url).hash.slice(1);
const invitation = await call("/api/rsvp", null, "POST", {
  token,
  action: "read",
});
assert.deepEqual(
  invitation.guests.map((g) => g.id),
  ["g1", "g2"],
);
assert.equal(invitation.guests[0].email, undefined);
assert.equal(invitation.guests[0].notes, undefined);
assert.equal(invitation.state, undefined);
assert.equal(invitation.wedding.budget, undefined);
await call("/api/rsvp", null, "POST", { token: "bad", action: "read" }, 404);
const reply = (id, rsvp) => ({ id, rsvp, meal: "Vegan", dietary: "No nuts" });
await call(
  "/api/rsvp",
  null,
  "POST",
  { token, action: "respond", guests: [reply("g3", "confirmed")] },
  403,
);
await call(
  "/api/rsvp",
  null,
  "POST",
  {
    token,
    action: "respond",
    guests: [
      { ...reply("g1", "declined"), notes: "attack" },
      reply("g2", "confirmed"),
    ],
  },
  400,
);
await call("/api/rsvp", null, "POST", {
  token,
  action: "respond",
  guests: [reply("g1", "declined"), reply("g2", "confirmed")],
});
let after = await call("/api/plan");
assert.equal(after.state.guests[0].rsvp, "declined");
assert.equal(after.state.guests[0].table, "");
assert.equal(after.state.guests[0].notes, "private planning note");
assert.equal(after.state.guests[1].dietary, "No nuts");
assert.equal(after.state.guests[2].meal, "Vegetarian");
assert.equal(after.state.expenses[0].paid, 1000);
await call(
  "/api/plan",
  owner,
  "PUT",
  { state: current.state, revision: current.revision },
  409,
);
await call("/api/invitations", owner, "DELETE", { id: gi.id });
await call("/api/rsvp", null, "POST", { token, action: "read" }, 404);
await call(
  "/api/rsvp",
  null,
  "POST",
  {
    token,
    action: "respond",
    guests: [reply("g1", "confirmed"), reply("g2", "confirmed")],
  },
  404,
);
const member = (await call("/api/team")).members.find(
  (m) => m.email === editor.email,
);
await call("/api/team", owner, "DELETE", { id: member.id, kind: "member" });
await call(path("/api/plan"), editor, "GET", undefined, 403);
await call("/api/join", editor, "POST", { token: ei.token }, 404);
const stale = await call("/api/plan");
const results = await Promise.all(
  [1, 2].map(() =>
    fetch(origin + "/api/plan", {
      method: "PUT",
      headers: { ...auth(owner), "Content-Type": "application/json" },
      body: JSON.stringify({ state: stale.state, revision: stale.revision }),
    }),
  ),
);
assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
console.log(
  "Feature API checks passed: role permissions, shared edits, private documents, email-bound invites, revoked access, household RSVP isolation, editable replies, seating updates, CSRF checks, and concurrent-save protection.",
);

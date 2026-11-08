// Runs only against the local preview. Uses its documented mock sign-in.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:5173";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))
  throw Error("Local preview only");
const login = await fetch(origin + "/signin-with-chatgpt?return_to=/", {
  redirect: "manual",
});
const cookie = login.headers
  .getSetCookie()
  .map((c) => c.split(";")[0])
  .join("; ");
assert.ok(cookie, "local sign-in must provide a session");
const headers = { Cookie: cookie, "Content-Type": "application/json" };
const get = async () =>
  await (await fetch(origin + "/api/plan", { headers })).json();
const save = (state, revision, extra = {}) =>
  fetch(origin + "/api/plan", {
    method: "PUT",
    headers: { ...headers, ...extra },
    body: JSON.stringify({ state, revision }),
  });
assert.equal((await fetch(origin + "/api/plan")).status, 401);
assert.equal((await fetch(origin + "/api/documents?id=missing")).status, 401);
const initial = await get();
assert.equal(
  (
    await save(initial.state, initial.revision, {
      Origin: "https://unrelated.example",
    })
  ).status,
  403,
);
assert.equal(
  (
    await save(
      { ...initial.state, settings: { ...initial.state.settings, budget: -1 } },
      initial.revision,
    )
  ).status,
  400,
);
const first = await save(initial.state, initial.revision);
assert.equal(first.status, 200);
const updated = await first.json();
assert.equal(updated.revision, initial.revision + 1);
assert.equal(
  (await save(initial.state, initial.revision)).status,
  409,
  "stale writes must not overwrite newer data",
);
const form = new FormData();
form.append(
  "file",
  new File(["Wedding planner test document\n"], "test-quote.txt", {
    type: "text/plain",
  }),
);
form.append("folder", "Quotes");
const upload = await fetch(origin + "/api/documents", {
  method: "POST",
  headers: { Cookie: cookie },
  body: form,
});
assert.equal(upload.status, 200);
const doc = await upload.json();
assert.equal(
  (
    await save(
      {
        ...initial.state,
        documents: [
          ...initial.state.documents,
          { ...doc, key: "someone-else/file" },
        ],
      },
      updated.revision,
    )
  ).status,
  403,
);
const linked = await save(
  { ...initial.state, documents: [...initial.state.documents, doc] },
  updated.revision,
);
assert.equal(linked.status, 200);
const file = await fetch(origin + "/api/documents?id=" + doc.id, {
  headers: { Cookie: cookie },
});
assert.equal(file.status, 200);
assert.equal(await file.text(), "Wedding planner test document\n");
assert.match(file.headers.get("content-disposition"), /attachment/);
const current = await get();
assert.equal((await save(initial.state, current.revision)).status, 200);
assert.equal(
  (
    await fetch(origin + "/api/documents?id=" + doc.id, {
      headers: { Cookie: cookie },
    })
  ).status,
  404,
  "unlinked documents cannot be downloaded",
);
console.log(
  "API smoke passed: sign-in, persistence, validation, origin checking, revision conflicts, private upload/download and document ownership.",
);

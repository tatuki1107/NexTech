import { test } from "node:test";
import assert from "node:assert/strict";
import { apiRequest, getAll, ApiError } from "../app/(participant)/_lib/api.ts";
const unauthorized = () => Response.json({ error: { message: "ログインが必要です" } }, { status: 401 });

test("concurrent expired requests perform a single refresh and retry with the new session", async () => {
  const original = globalThis.fetch;
  let refreshed = false, rotations = 0;
  globalThis.fetch = async (url) => {
    if (url === "/api/v1/auth/refresh") {
      rotations++; await new Promise(resolve => setTimeout(resolve, 5)); refreshed = true;
      return Response.json({ data: { user: { id: "participant" } } });
    }
    return refreshed ? Response.json({ data: [] }) : unauthorized();
  };
  try {
    await Promise.all([apiRequest("/me/saved-events"), apiRequest("/me/notifications")]);
    assert.equal(rotations, 1);
  } finally { globalThis.fetch = original; }
});
test("transient refresh outages remain retryable instead of being treated as logout", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => url === "/api/v1/auth/refresh" ? Response.json({ error: {} }, { status: 502 }) : unauthorized();
  try { await assert.rejects(apiRequest("/me"), error => error instanceof ApiError && error.status === 502); }
  finally { globalThis.fetch = original; }
});
test("login failures do not renew another session or hide the credential error", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return unauthorized(); };
  try {
    await assert.rejects(apiRequest("/auth/login", { method: "POST" }), error => error.status === 401);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
test("personal and public lists read every API page instead of stopping at the first 100", async () => {
  const original = globalThis.fetch;
  const pages = [];
  globalThis.fetch = async url => {
    const page = Number(new URL(url, "http://localhost").searchParams.get("page"));
    pages.push(page);
    return Response.json({ data: page === 1 ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 100 }], pagination: { page, perPage: 100, total: 101 } });
  };
  try { assert.equal((await getAll("/events")).length, 101); assert.deepEqual(pages, [1, 2]); }
  finally { globalThis.fetch = original; }
});

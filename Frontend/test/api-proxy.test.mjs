import { test } from "node:test";
import assert from "node:assert/strict";
import { proxyParticipantApi, isParticipantEndpoint } from "../app/_lib/api-proxy.ts";
import { safeReturnTo } from "../app/(participant)/_lib/api.ts";
const origin = "http://localhost:13200";
const request = (path, method = "GET", headers = {}) => new Request(origin + "/api/v1/" + path, { method, headers: { origin, ...headers } });

test("participant proxy does not expose organizer/admin mutations or arbitrary upstream paths", async () => {
  for (const path of ["admin/events", "../auth/login", "events/http://example.test", "organizers"]) {
    assert.equal((await proxyParticipantApi(request(path, "POST"), path.split("/"), () => { throw Error("must not fetch"); })).status, 404);
  }
  assert.equal(isParticipantEndpoint("me/notifications/read-all", "PUT"), true);
  assert.equal(isParticipantEndpoint("auth/refresh", "GET"), false);
});
test("cookie-authenticated writes require the same origin including login/logout", async () => {
  for (const path of ["auth/login", "auth/logout", "me"]) {
    const method = path === "me" ? "PATCH" : "POST";
    for (const suppliedOrigin of ["https://evil.example", "null", ""]) {
      const response = await proxyParticipantApi(request(path, method, { origin: suppliedOrigin }), path.split("/"), () => { throw Error("must not fetch"); });
      assert.equal(response.status, 403);
    }
  }
});
test("login keeps access tokens out of JSON and sets an HttpOnly cookie while relaying refresh cookie", async () => {
  const response = await proxyParticipantApi(request("auth/login", "POST"), ["auth", "login"], async () => Response.json({ data: { accessToken: "header.payload.signature", expiresIn: 900, user: { id: "test-user" } } }, { headers: { "set-cookie": "nextechRefreshToken=test-refresh; HttpOnly; Path=/api/v1/auth; SameSite=Lax" } }));
  const payload = await response.json();
  assert.equal(payload.data.accessToken, undefined);
  assert.deepEqual(payload.data.user, { id: "test-user" });
  assert.match(response.headers.getSetCookie().find(cookie => cookie.startsWith("nextechAccessToken=")), /HttpOnly; SameSite=Lax; Max-Age=900/);
  assert.match(response.headers.getSetCookie().find(cookie => cookie.startsWith("nextechRefreshToken=")), /Path=\/api\/v1\/auth/);
  assert.match(response.headers.get("cache-control"), /no-store/);
});
test("same-origin writes use the external Host rather than the Next internal hostname", async () => {
  const req = new Request("http://localhost:13200/api/v1/auth/logout", { method: "POST", headers: { host: "127.0.0.1:13200", origin, "x-forwarded-host": "localhost:13200" } });
  assert.equal((await proxyParticipantApi(req, ["auth", "logout"], async () => new Response(null, { status: 204 }))).status, 403);
  req.headers.set("origin", "http://127.0.0.1:13200");
  assert.equal((await proxyParticipantApi(req, ["auth", "logout"], async () => new Response(null, { status: 204 }))).status, 204);
});
test("upstream headers come from scoped cookies, not caller-supplied Authorization", async () => {
  await proxyParticipantApi(request("me", "GET", { cookie: "nextechAccessToken=real-token; other=secret", authorization: "Bearer forged" }), ["me"], async (_url, init) => {
    assert.equal(init.headers.get("authorization"), "Bearer real-token");
    assert.equal(init.headers.get("cookie"), null);
    assert.equal(init.cache, "no-store");
    return Response.json({ data: { id: "test-user" } });
  });
});
test("refresh cookie is forwarded only to auth and access cookie is expired on logout", async () => {
  const response = await proxyParticipantApi(request("auth/logout", "POST", { cookie: "nextechRefreshToken=refresh-only; unrelated=private" }), ["auth", "logout"], async (_url, init) => {
    assert.equal(init.headers.get("cookie"), "nextechRefreshToken=refresh-only");
    return new Response(null, { status: 204 });
  });
  assert.equal(response.status, 204);
  assert.match(response.headers.get("set-cookie"), /nextechAccessToken=;.*Max-Age=0/);
});
test("upstream failures do not expose internal addresses or errors", async () => {
  const response = await proxyParticipantApi(request("events"), ["events"], async () => { throw Error("postgres://internal-secret"); });
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /postgres|internal-secret/);
});
test("post-login redirect only allows local paths", () => {
  for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/\nevil"]) assert.equal(safeReturnTo(value), "/mypage");
  assert.equal(safeReturnTo("/events/abc?from=search"), "/events/abc?from=search");
});

import { beforeAll, describe, expect, spyOn, test } from "bun:test";
import { createApp } from "../src/app";
import { sqlClient } from "../src/db";
import { env } from "../src/env";
import { assertContract, specification } from "./contract";

const app = createApp();
const prefix = crypto.randomUUID();
const password = "requirements-test-password";
type Auth = { accessToken: string; user: { id: string } };
type Event = { id: string; status: string; participationRequirements: string | null; onlineUrl: string | null };
type Registration = { registrationId: string; status: string; waitlistPosition: number | null };
type Metric = { month: string; eventCount: number; participantCount: number; registrationCount: number; capacity: number; applicationRate: number };
let ipSequence = 1;
const call = async <T = Record<string, unknown>>(path: string, method = "GET", body?: unknown, token?: string, extra: Record<string, string> = {}) => {
  const response = await app.handle(new Request(`http://localhost/api/v1${path}`, { method, headers: {
    ...(body === undefined ? {} : { "content-type": "application/json" }), ...(token ? { authorization: `Bearer ${token}` } : {}),
    "x-forwarded-for": `192.0.2.${ipSequence++ % 250 + 1}`, ...extra,
  }, body: body === undefined ? undefined : JSON.stringify(body) }));
  const payload = response.status === 204 ? null : await response.json() as { data: T; pagination: { total: number }; error?: { code: string } };
  assertContract(path, method, response, payload);
  return { response, payload, data: payload?.data as T };
};

describe.skipIf(process.env.RUN_DB_TESTS !== "1")("requirements and API contracts", () => {
  let owner: Auth, admin: Auth, participant: Auth;
  let organizerId: string, categoryId: string, tagId: string, eventId: string;
  const signup = async (name: string) => {
    const result = await call<Auth>("/auth/signup", "POST", { email: `${name}-${prefix}@example.test`, password, displayName: name });
    expect(result.response.status).toBe(201);
    expect(result.response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(result.response.headers.get("set-cookie")).toContain("Path=/api/v1/auth");
    return result.data;
  };
  const createEvent = async (capacity = 2) => {
    const result = await call<Event>(`/organizers/${organizerId}/events`, "POST", {
      title: `要件テスト-${prefix}`, description: "日本語の部分一致検索", categoryId, tagIds: [tagId],
      format: "online", onlineUrl: "https://example.test/secret-room", startAt: "2090-02-15T01:00:00Z", endAt: "2090-02-15T03:00:00Z",
      applicationDeadline: "2090-02-14T01:00:00Z", capacity, waitlistEnabled: true, participationRequirements: "TypeScriptの基礎知識",
    }, owner.accessToken);
    expect(result.response.status).toBe(201);
    return result.data.id;
  };
  beforeAll(async () => {
    owner = await signup("req-owner"); admin = await signup("req-admin"); participant = await signup("req-participant");
    await sqlClient`INSERT INTO user_roles (user_id,role_code) VALUES (${admin.user.id},'admin')`;
    organizerId = (await call<{ id: string }>("/organizers", "POST", { name: `仕様主催者-${prefix}`, slug: `req-${prefix}` }, owner.accessToken)).data.id;
    const [category] = await sqlClient`INSERT INTO categories (name,slug) VALUES ('Requirements',${prefix}) RETURNING id`;
    const [tag] = await sqlClient`INSERT INTO tags (name,slug) VALUES ('Requirements',${prefix}) RETURNING id`;
    categoryId = String(category.id); tagId = String(tag.id); eventId = await createEvent();
  });

  test("owners publish without administrator privileges; unrelated users cannot", async () => {
    expect((await call(`/events/${eventId}/status`, "PATCH", { status: "published" }, participant.accessToken)).response.status).toBe(403);
    const published = await call<Event>(`/events/${eventId}/status`, "PATCH", { status: "published" }, owner.accessToken);
    expect(published.response.status).toBe(200);
    expect(published.data.status).toBe("published");
    expect(published.data.participationRequirements).toBe("TypeScriptの基礎知識");
    expect(published.data.onlineUrl).toBe("https://example.test/secret-room");
    expect((await call<Event>(`/events/${eventId}`)).data.onlineUrl).toBeNull();
    expect((await call(`/events/${eventId}/status`, "PATCH", { status: "completed" }, owner.accessToken)).response.status).toBe(422);
  });

  test("search supports organizer name, Japanese keyword, dates, tags, format and empty pages", async () => {
    const query = `organizerName=${encodeURIComponent(`仕様主催者-${prefix}`)}&keyword=${encodeURIComponent("部分一致")}&startDate=2090-02-15&endDate=2090-02-15&tagIds=${tagId}&format=online&hasCapacity=true`;
    const found = await call<Event[]>(`/events?${query}`);
    expect(found.data.map(event => event.id)).toEqual([eventId]);
    const empty = await call<Event[]>(`/events?${query}&page=100`);
    expect(empty.data).toEqual([]);
    expect(empty.payload?.pagination.total).toBe(1);
    expect((await call("/events?startDate=2090-02-16&endDate=2090-02-15")).response.status).toBe(400);
  });

  test("parallel requests never exceed capacity, duplicate users or waitlist ranks", async () => {
    const concurrentId = await createEvent(2);
    await call(`/events/${concurrentId}/status`, "PATCH", { status: "published" }, owner.accessToken);
    const users = await Promise.all(Array.from({ length: 8 }, (_, index) => signup(`parallel-${index}`)));
    const results = await Promise.all(users.map(user => call<Registration>(`/events/${concurrentId}/registrations`, "POST", {}, user.accessToken)));
    expect(results.every(result => result.response.status === 201)).toBeTrue();
    expect(results.filter(result => result.data.status === "confirmed")).toHaveLength(2);
    expect(results.filter(result => result.data.status === "waitlisted").map(result => result.data.waitlistPosition).sort()).toEqual([1,2,3,4,5,6]);
    const confirmedIndex = results.findIndex(result => result.data.status === "confirmed");
    expect((await call(`/events/${concurrentId}/registration`, "DELETE", undefined, users[confirmedIndex]!.accessToken)).response.status).toBe(200);
    const waiting = await sqlClient`SELECT waitlist_position FROM registrations WHERE event_id=${concurrentId} AND status='waitlisted' ORDER BY waitlist_position`;
    expect(waiting.map((row: { waitlist_position: number }) => row.waitlist_position)).toEqual([1,2,3,4,5]);
    const [history] = await sqlClient`SELECT event_id,user_id FROM registration_status_histories WHERE registration_id=${results[confirmedIndex]!.data.registrationId} LIMIT 1`;
    expect(history.event_id).toBe(concurrentId); expect(history.user_id).toBe(users[confirmedIndex]!.user.id);
    const duplicateId = await createEvent();
    await call(`/events/${duplicateId}/status`, "PATCH", { status: "published" }, owner.accessToken);
    const duplicates = await Promise.all([1,2].map(() => call(`/events/${duplicateId}/registrations`, "POST", {}, participant.accessToken)));
    expect(duplicates.map(result => result.response.status).sort()).toEqual([201,409]);
  });

  test("participant lookup accepts registration IDs and check-in is not repeatable", async () => {
    const applied = await call<Registration>(`/events/${eventId}/registrations`, "POST", {}, participant.accessToken);
    const listed = await call<Array<{ id: string }>>(`/events/${eventId}/registrations?keyword=${applied.data.registrationId}`, "GET", undefined, owner.accessToken);
    expect(listed.data.map(row => row.id)).toEqual([applied.data.registrationId]);
    expect((await call(`/events/${eventId}/registrations/${applied.data.registrationId}/check-in`, "POST", {}, owner.accessToken)).response.status).toBe(200);
    expect((await call(`/events/${eventId}/registrations/${applied.data.registrationId}/check-in`, "POST", {}, owner.accessToken)).response.status).toBe(422);
    expect((await call<{ confirmedCount: number; attendedCount: number }>(`/events/${eventId}/recruitment-summary`, "GET", undefined, owner.accessToken)).data).toMatchObject({ confirmedCount: 1, attendedCount: 1 });
    expect((await call<Event>(`/events/${eventId}`, "GET", undefined, participant.accessToken)).data.onlineUrl).toBe("https://example.test/secret-room");
    const mine = await call<unknown[]>("/me/registrations?view=upcoming", "GET", undefined, participant.accessToken);
    expect(mine.data.length).toBeGreaterThan(0);
  });

  test("administrators search all management targets, record reviews and read histories", async () => {
    for (const path of [`/admin/events?keyword=${prefix}&from=2090-02-01&to=2090-02-28`, `/admin/organizers?keyword=${prefix}`, `/admin/registrations?eventId=${eventId}`]) {
      expect((await call(path, "GET", undefined, participant.accessToken)).response.status).toBe(403);
      const result = await call<unknown[]>(path, "GET", undefined, admin.accessToken);
      expect(result.response.status).toBe(200); expect(result.data.length).toBeGreaterThan(0);
    }
    const registrations = await call<Array<{ id: string }>>(`/admin/registrations?eventId=${eventId}`, "GET", undefined, admin.accessToken);
    const registrationId = registrations.data[0]!.id;
    expect((await call(`/admin/events/${eventId}`, "GET", undefined, admin.accessToken)).response.status).toBe(200);
    expect((await call(`/admin/organizers/${organizerId}`, "GET", undefined, admin.accessToken)).response.status).toBe(200);
    expect((await call<{ history: unknown[] }>(`/admin/registrations/${registrationId}`, "GET", undefined, admin.accessToken)).data.history.length).toBe(2);
    for (const [targetType, targetId] of [["event", eventId], ["organizer", organizerId], ["registration", registrationId]]) {
      expect((await call("/admin/reviews", "POST", { targetType, targetId, reason: "Checked" }, admin.accessToken)).response.status).toBe(204);
      const history = await call<Array<{ action: string }>>(`/admin/moderation-actions?targetType=${targetType}&targetId=${targetId}`, "GET", undefined, admin.accessToken);
      expect(history.data.some(row => row.action === "reviewed")).toBeTrue();
    }
    const history = await call<unknown[]>(`/events/${eventId}/history`, "GET", undefined, owner.accessToken);
    expect(history.data.length).toBeGreaterThan(1);
    expect((await call(`/events/${eventId}/history`, "GET", undefined, participant.accessToken)).response.status).toBe(403);
    const empty = await call<unknown[]>(`/admin/events?keyword=${prefix}&page=10000`, "GET", undefined, admin.accessToken);
    expect(empty.data).toEqual([]); expect(empty.payload!.pagination.total).toBeGreaterThan(0);
  });

  test("moderation requires reasons, supports hiding/restoring and stops suspended organizers", async () => {
    expect((await call(`/admin/events/${eventId}/status`, "PATCH", { status: "draft" }, admin.accessToken)).response.status).toBe(400);
    expect((await call(`/admin/events/${eventId}/status`, "PATCH", { status: "draft", reason: "Review" }, admin.accessToken)).response.status).toBe(200);
    expect((await call(`/events/${eventId}`)).response.status).toBe(404);
    expect((await call(`/events/${eventId}/status`, "PATCH", { status: "published" }, owner.accessToken)).response.status).toBe(403);
    expect((await call(`/admin/events/${eventId}/status`, "PATCH", { status: "published", reason: "Resolved" }, admin.accessToken)).response.status).toBe(200);
    expect((await call(`/admin/organizers/${organizerId}/status`, "PATCH", { status: "suspended", reason: "Review" }, admin.accessToken)).response.status).toBe(200);
    expect((await call(`/events/${eventId}`)).response.status).toBe(404);
    expect((await call(`/events/${eventId}/status`, "PATCH", { status: "published" }, owner.accessToken)).response.status).toBe(403);
    expect((await call(`/events/${eventId}/registrations`, "POST", {}, owner.accessToken)).response.status).toBe(404);
    expect((await call(`/admin/organizers/${organizerId}/status`, "PATCH", { status: "active", reason: "Resolved" }, admin.accessToken)).response.status).toBe(200);
    expect((await call(`/events/${eventId}`)).response.status).toBe(200);
    const cancelledId = await createEvent();
    expect((await call(`/events/${cancelledId}/status`, "PATCH", { status: "cancelled" }, owner.accessToken)).response.status).toBe(200);
    expect((await call(`/events/${cancelledId}/status`, "PATCH", { status: "published" }, owner.accessToken)).response.status).toBe(422);
  });

  test("recommendations use past participation and matching organizer or tags", async () => {
    const [past] = await sqlClient`INSERT INTO events (organizer_id,category_id,created_by,title,description,format,online_url,timezone,start_at,end_at,capacity,status) VALUES (${organizerId},${categoryId},${owner.user.id},'Past event','Past','online','https://example.test/past','Asia/Tokyo','2020-01-01','2020-01-02',10,'completed') RETURNING id`;
    await sqlClient`INSERT INTO registrations(event_id,user_id,status) VALUES (${past.id},${owner.user.id},'checked_in')`;
    await sqlClient`INSERT INTO event_tags(event_id,tag_id) VALUES (${past.id},${tagId})`;
    const otherOrganizer = (await call<{ id: string }>("/organizers", "POST", { name: "Related by tag", slug: `tag-${prefix}` }, admin.accessToken)).data.id;
    const [tagMatch] = await sqlClient`INSERT INTO events (organizer_id,category_id,created_by,title,description,format,venue_name,timezone,start_at,end_at,capacity,status)
      VALUES (${otherOrganizer},${categoryId},${admin.user.id},'Related by tag','Fixture','offline','Fixture','Asia/Tokyo','2090-03-01','2090-03-02',10,'published') RETURNING id`;
    await sqlClient`INSERT INTO event_tags(event_id,tag_id) VALUES (${tagMatch.id},${tagId})`;
    const related = await call<Event[]>("/me/related-events", "GET", undefined, owner.accessToken);
    expect(related.data.some(event => event.id === eventId)).toBeTrue();
    expect(related.data.some(event => event.id === tagMatch.id)).toBeTrue();
    expect(related.data.every(event => event.onlineUrl === undefined)).toBeTrue();
    expect((await call<Event[]>("/me/related-events", "GET", undefined, admin.accessToken)).data).toEqual([]);
  });

  test("analytics include participant trends, rates, zero months, groups and previous periods", async () => {
    const result = await call<Metric[]>("/admin/analytics/monthly-events?from=2090-01-01&to=2090-03-31", "GET", undefined, admin.accessToken);
    expect(result.response.status).toBe(200);
    expect(result.data.map(row => row.month)).toEqual(["2090-01", "2090-02", "2090-03"]);
    expect(result.data[0]!.eventCount).toBe(0);
    expect(result.data[1]!.participantCount).toBeGreaterThan(0);
    expect(result.data[1]!.applicationRate).toBeGreaterThan(0);
    const [boundary] = await sqlClient`INSERT INTO events (organizer_id,category_id,created_by,title,description,format,venue_name,timezone,start_at,end_at,capacity,status)
      VALUES (${organizerId},${categoryId},${owner.user.id},'Tokyo midnight','Fixture','offline','Fixture','Asia/Tokyo','2090-02-28T15:30:00Z','2090-02-28T16:30:00Z',2,'published') RETURNING id`;
    await sqlClient`INSERT INTO registrations(event_id,user_id,status) VALUES (${boundary.id},${owner.user.id},'confirmed')`;
    const boundaryReport = await call<Array<Metric & { categoryId: string }>>("/admin/analytics/popular-categories?from=2090-03-01&to=2090-03-01&limit=100", "GET", undefined, admin.accessToken);
    expect(boundaryReport.data.find(row => row.categoryId === categoryId)).toMatchObject({ eventCount: 2, participantCount: 1, capacity: 12 });
    for (const path of ["popular-categories", "popular-organizers"]) expect((await call(`/admin/analytics/${path}?from=2090-01-01&to=2090-03-31&metric=applicationRate`, "GET", undefined, admin.accessToken)).response.status).toBe(200);
    for (const groupBy of ["category", "organizer", "format"]) {
      const report = await call<{ current: { items: unknown[] }; previous: { from: string; to: string } }>(`/admin/analytics/report?from=2090-02-01&to=2090-02-28&groupBy=${groupBy}`, "GET", undefined, admin.accessToken);
      expect(report.response.status).toBe(200); expect(report.data.current.items.length).toBeGreaterThan(0);
      expect(report.data.previous).toMatchObject({ from: "2090-01-04", to: "2090-01-31" });
    }
    expect((await call("/admin/analytics/report?from=2090-03-01&to=2090-02-01", "GET", undefined, admin.accessToken)).response.status).toBe(400);
    expect((await call("/admin/analytics/report?from=2090-01-01&to=2090-02-01", "GET", undefined, participant.accessToken)).response.status).toBe(403);
  });

  test("all protected OpenAPI operations reject anonymous requests", async () => {
    for (const [path, methods] of Object.entries(specification.paths)) for (const [method, operation] of Object.entries(methods)) {
      if (operation.security?.length === 0) continue;
      const resolved = path.replace(/\{[^}]+\}/g, eventId);
      const query = new URLSearchParams();
      for (const parameter of operation.parameters ?? []) {
        const name = parameter.name ?? (parameter.$ref?.endsWith("FromDate") ? "from" : parameter.$ref?.endsWith("ToDate") ? "to" : undefined);
        if (!name || parameter.in === "path") continue;
        if (name === "from" || name === "to") query.set(name, "2090-01-01");
        if (name === "targetId") query.set(name, eventId);
        if (name === "targetType") query.set(name, "event");
      }
      // Some write operations validate bodies before auth. Supply valid values for each boundary.
      let body: unknown;
      if (method === "patch" && path.endsWith("/status")) body = { status: path.includes("organizers") ? "active" : "published", reason: "Review" };
      else if (path === "/admin/reviews") body = { targetType: "event", targetId: eventId };
      else if (method === "post" && path === "/organizers") body = { name: "Test", slug: "test" };
      else if (method === "post" && path.endsWith("/events")) body = { title: "Test", description: "Test", categoryId, format: "offline", venueName: "Test", startAt: "2090-01-02T00:00:00Z", endAt: "2090-01-02T01:00:00Z", capacity: 1, waitlistEnabled: false, applicationDeadline: "2090-01-01T00:00:00Z" };
      else if (["post", "patch"].includes(method)) body = {};
      const result = await call(`${resolved}?${query}`, method.toUpperCase(), body);
      expect(result.response.status, `${method} ${path}`).toBe(401);
    }
  });

  test("auth rejects duplicates, bad passwords, stopped users and expired JWTs; enforces origins", async () => {
    expect((await call("/auth/signup", "POST", { email: `req-owner-${prefix}@example.test`, password, displayName: "duplicate" })).response.status).toBe(409);
    expect((await call("/auth/login", "POST", { email: `req-owner-${prefix}@example.test`, password: "wrong" })).response.status).toBe(401);
    await sqlClient`UPDATE users SET status='inactive' WHERE id=${participant.user.id}`;
    expect((await call("/me", "GET", undefined, participant.accessToken)).response.status).toBe(401);
    await sqlClient`UPDATE users SET status='active' WHERE id=${participant.user.id}`;
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: owner.user.id, jti: crypto.randomUUID(), iss: env.JWT_ISSUER, aud: env.JWT_AUDIENCE, iat: 1, exp: 2 })).toString("base64url");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`))).toString("base64url");
    expect((await call("/me", "GET", undefined, `${header}.${payload}.${signature}`)).response.status).toBe(401);
    for (const path of ["/auth/refresh", "/auth/logout"]) expect((await call(path, "POST", undefined, undefined, { origin: "https://untrusted.example.test" })).response.status).toBe(403);
    const login = await call<Auth>("/auth/login", "POST", { email: `req-owner-${prefix}@example.test`, password });
    const cookie = login.response.headers.get("set-cookie")!.split(";")[0]!;
    expect((await call("/auth/logout", "POST", undefined, undefined, { cookie })).response.status).toBe(204);
    expect((await call("/auth/refresh", "POST", undefined, undefined, { cookie })).response.status).toBe(401);
  });

  test("unexpected errors expose no exception content in response or structured log", async () => {
    const logger = spyOn(console, "error").mockImplementation(() => {});
    try {
      const failing = createApp().get("/failure-test", () => { throw new Error("SQL password token private@example.test"); });
      const response = await failing.handle(new Request("http://localhost/failure-test"));
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("private@example.test");
      expect(JSON.stringify(logger.mock.calls)).not.toContain("password");
    } finally { logger.mockRestore(); }
  });
});

import { beforeAll, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { sqlClient } from "../src/db";

const app = createApp();
const password = "integration-test-password";
const prefix = crypto.randomUUID();
type Auth = { accessToken: string; user: { id: string } };
type Registration = { registrationId: string; status: string; waitlistPosition: number | null };

async function call<T = Record<string, unknown>>(path: string, method = "GET", body?: unknown, token?: string, cookie?: string) {
  const response = await app.handle(new Request(`http://localhost${path}`, {
    method,
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const payload = response.status === 204 ? null : await response.json() as { data: T; error?: { code: string } };
  return { response, payload, data: payload?.data as T };
}

describe.skipIf(process.env.RUN_DB_TESTS !== "1")("API integration against migrated dev schema", () => {
  let owner: Auth, first: Auth, second: Auth;
  let organizerId: string, categoryId: string, eventId: string;
  let firstRegistrationId: string, secondRegistrationId: string;

  beforeAll(async () => {
    for (const name of ["owner", "first", "second"]) {
      const result = await call<Auth>("/api/v1/auth/signup", "POST", { email: `${name}-${prefix}@example.test`, password, displayName: name });
      expect(result.response.status).toBe(201);
      if (name === "owner") owner = result.data;
      else if (name === "first") first = result.data;
      else second = result.data;
    }
    await sqlClient`INSERT INTO user_roles (user_id,role_code) VALUES (${owner.user.id},'admin')`;
    const created = await call<{ id: string }>("/api/v1/organizers", "POST", { name: "Integration organizer", slug: `integration-${prefix}` }, owner.accessToken);
    expect(created.response.status).toBe(201);
    organizerId = created.data.id;
    const [category] = await sqlClient`INSERT INTO categories (name,slug) VALUES ('Integration',${prefix}) RETURNING id`;
    categoryId = category.id as string;
    const createdEvent = await call<{ id: string }>(`/api/v1/organizers/${organizerId}/events`, "POST", {
      title: "Integration event", description: "Contract test", categoryId, format: "offline", venueName: "Test venue",
      startAt: "2099-01-02T10:00:00Z", endAt: "2099-01-02T12:00:00Z", applicationDeadline: "2099-01-01T10:00:00Z", capacity: 1, waitlistEnabled: true,
    }, owner.accessToken);
    expect(createdEvent.response.status).toBe(201);
    eventId = createdEvent.data.id;
    expect((await call(`/api/v1/admin/events/${eventId}/status`, "PATCH", { status: "published" }, owner.accessToken)).response.status).toBe(200);
    await sqlClient`DELETE FROM user_roles WHERE user_id=${owner.user.id} AND role_code='admin'`;
  });

  test("preserves legacy envelopes alongside versioned routes", async () => {
    expect((await call("/health")).response.status).toBe(200);
    const legacy = await app.handle(new Request(`http://localhost/api/events/${eventId}`));
    expect(legacy.status).toBe(200);
    expect((await legacy.json()).event.id).toBe(eventId);
  });

  test("rejects unauthorized writes and invalid filters", async () => {
    expect((await call(`/api/v1/events/${eventId}/registrations`, "POST", {})).response.status).toBe(401);
    expect((await call(`/api/v1/organizers/${organizerId}/events`, "GET", undefined, first.accessToken)).response.status).toBe(403);
    expect((await call("/api/v1/events?tagIds=not-a-uuid")).response.status).toBe(400);
  });

  test("applies once, waitlists, promotes and reuses cancelled registration with history", async () => {
    const applied = await call<Registration>(`/api/v1/events/${eventId}/registrations`, "POST", {}, first.accessToken);
    expect(applied.response.status).toBe(201);
    expect(applied.data.status).toBe("confirmed");
    firstRegistrationId = applied.data.registrationId;
    expect((await call(`/api/v1/events/${eventId}/registrations`, "POST", {}, first.accessToken)).response.status).toBe(409);
    const waiting = await call<Registration>(`/api/v1/events/${eventId}/registrations`, "POST", {}, second.accessToken);
    expect(waiting.data.status).toBe("waitlisted");
    secondRegistrationId = waiting.data.registrationId;
    expect((await call(`/api/v1/events/${eventId}/registration`, "DELETE", undefined, first.accessToken)).response.status).toBe(200);
    const [promoted] = await sqlClient`SELECT status FROM registrations WHERE id=${secondRegistrationId}`;
    expect(promoted.status).toBe("confirmed");
    const reapplied = await call<Registration>(`/api/v1/events/${eventId}/registrations`, "POST", {}, first.accessToken);
    expect(reapplied.response.status).toBe(201);
    expect(reapplied.data.registrationId).toBe(firstRegistrationId);
    expect(reapplied.data.status).toBe("waitlisted");
    const [{ count }] = await sqlClient`SELECT count(*)::int AS count FROM registration_status_histories WHERE registration_id=${firstRegistrationId}`;
    expect(Number(count)).toBe(3);
  });

  test("check-in uses checked_in and never frees capacity", async () => {
    const checked = await call<{ status: string }>(`/api/v1/events/${eventId}/registrations/${secondRegistrationId}/check-in`, "POST", {}, owner.accessToken);
    expect(checked.response.status).toBe(200);
    expect(checked.data.status).toBe("checked_in");
    expect((await call<{ confirmedCount: number }>(`/api/v1/events/${eventId}`)).data.confirmedCount).toBe(1);
    expect((await call(`/api/v1/events/${eventId}/registration`, "DELETE", undefined, second.accessToken)).response.status).toBe(422);
  });

  test("supports existing owners without membership and rolls back invalid edits", async () => {
    await sqlClient`DELETE FROM organizer_members WHERE organizer_id=${organizerId} AND user_id=${owner.user.id}`;
    expect((await call(`/api/v1/organizers/${organizerId}`, "PATCH", { name: "Updated organizer" }, owner.accessToken)).response.status).toBe(200);
    const invalid = await call(`/api/v1/events/${eventId}`, "PATCH", { title: "Must roll back", tagIds: [crypto.randomUUID()] }, owner.accessToken);
    expect(invalid.response.status).toBe(422);
    const [event] = await sqlClient`SELECT title FROM events WHERE id=${eventId}`;
    expect(event.title).toBe("Integration event");
  });

  test("hides private events and supports favorites and my registrations", async () => {
    expect((await call(`/api/v1/me/favorite-organizers/${organizerId}`, "PUT", undefined, first.accessToken)).response.status).toBe(204);
    expect((await call(`/api/v1/me/favorite-categories/${categoryId}`, "PUT", undefined, first.accessToken)).response.status).toBe(204);
    expect((await call<unknown[]>("/api/v1/me/registrations", "GET", undefined, first.accessToken)).data.length).toBeGreaterThan(0);
    await sqlClient`UPDATE events SET visibility='private' WHERE id=${eventId}`;
    expect((await call(`/api/v1/events/${eventId}`)).response.status).toBe(404);
    expect((await call(`/api/v1/events/${eventId}`, "GET", undefined, first.accessToken)).response.status).toBe(404);
    expect((await call(`/api/v1/events/${eventId}`, "GET", undefined, owner.accessToken)).response.status).toBe(200);
    expect((await call(`/api/v1/events/${eventId}/registrations`, "POST", {}, first.accessToken)).response.status).toBe(404);
  });

  test("rotates refresh sessions and rejects replay", async () => {
    const login = await call<Auth>("/api/v1/auth/login", "POST", { email: `FIRST-${prefix}@example.test`, password });
    expect(login.response.status).toBe(200);
    const oldCookie = login.response.headers.get("set-cookie")!.split(";")[0]!;
    const refreshed = await call<Auth>("/api/v1/auth/refresh", "POST", undefined, undefined, oldCookie);
    expect(refreshed.response.status).toBe(200);
    const newCookie = refreshed.response.headers.get("set-cookie")!.split(";")[0]!;
    expect((await call("/api/v1/auth/refresh", "POST", undefined, undefined, oldCookie)).response.status).toBe(401);
    expect((await call("/api/v1/auth/refresh", "POST", undefined, undefined, newCookie)).response.status).toBe(401);
    const logout = await call("/api/v1/auth/logout", "POST", undefined, undefined, newCookie);
    expect(logout.response.status).toBe(204);
    expect(logout.response.headers.get("set-cookie")).toContain("Path=/api/v1/auth");
  });
});

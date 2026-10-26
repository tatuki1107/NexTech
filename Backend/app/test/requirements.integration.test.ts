import { beforeAll, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { sqlClient } from "../src/db";
import {
  createAccessToken,
  createRefreshSession,
  rotateRefreshSession,
} from "../src/lib/auth";

const app = createApp();
const prefix = crypto.randomUUID();
type Actor = { id: string; token: string; email: string };
type Event = { id: string; version: number; title: string };
type Registration = {
  registrationId: string;
  status: string;
  waitlistPosition: number | null;
};
async function call<T = Record<string, unknown>>(
  path: string,
  method = "GET",
  body?: unknown,
  token?: string,
  extraHeaders: Record<string, string> = {},
) {
  const response = await app.handle(
    new Request("http://localhost/api/v1" + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: "Bearer " + token } : {}),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  const payload =
    response.status === 204
      ? null
      : ((await response.json()) as { data: T; error?: { code: string } });
  return {
    status: response.status,
    data: payload?.data as T,
    error: payload?.error,
  };
}
describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "requirements and API safety",
  () => {
    let owner: Actor,
      admin: Actor,
      outsider: Actor,
      users: Actor[],
      organizerId: string,
      categoryId: string,
      tagId: string;
    const password = "test-only-api-password";
    beforeAll(async () => {
      const hash = await Bun.password.hash(password);
      const actors: Actor[] = [];
      for (let index = 0; index < 9; index++) {
        const email = `requirements-${prefix}-${index}@example.test`;
        const [user] =
          await sqlClient`INSERT INTO users(email,password_hash,display_name) VALUES(${email},${hash},${"Member " + index}) RETURNING id`;
        await sqlClient`INSERT INTO user_roles(user_id,role_code) VALUES(${user.id},'participant')`;
        actors.push({
          id: String(user.id),
          email,
          token: await createAccessToken(String(user.id)),
        });
      }
      [owner, admin, outsider, ...users] = actors;
      await sqlClient`INSERT INTO user_roles(user_id,role_code) VALUES(${admin.id},'admin')`;
      const organization = await call<{ id: string }>(
        "/organizers",
        "POST",
        { name: "東京要件" + prefix, slug: "req-" + prefix },
        owner.token,
      );
      expect(organization.status).toBe(201);
      organizerId = organization.data.id;
      const [category] =
        await sqlClient`INSERT INTO categories(name,slug) VALUES(${"Requirements " + prefix},${"req-" + prefix}) RETURNING id`;
      const [tag] =
        await sqlClient`INSERT INTO tags(name,slug) VALUES(${"Tag " + prefix},${"req-" + prefix}) RETURNING id`;
      categoryId = String(category.id);
      tagId = String(tag.id);
    });
    async function event(capacity = 2, publish = true): Promise<Event> {
      const created = await call<Event>(
        `/organizers/${organizerId}/events`,
        "POST",
        {
          title: "Requirements " + crypto.randomUUID(),
          description: "Description",
          categoryId,
          tagIds: [tagId],
          format: "online",
          onlineUrl: "https://example.test/private-meeting",
          startAt: "2090-02-02T10:00:00+09:00",
          endAt: "2090-02-02T12:00:00+09:00",
          applicationDeadline: "2090-02-01T23:00:00+09:00",
          capacity,
          waitlistEnabled: true,
        },
        owner.token,
      );
      expect(created.status).toBe(201);
      if (publish) {
        const published = await call<Event>(
          `/events/${created.data.id}/status`,
          "PATCH",
          { status: "published" },
          owner.token,
        );
        expect(published.status).toBe(200);
        return published.data;
      }
      return created.data;
    }
    async function apply(id: string, user: Actor) {
      const result = await call<Registration>(
        `/events/${id}/registrations`,
        "POST",
        {},
        user.token,
      );
      expect(result.status).toBe(201);
      return result.data;
    }
    test("owner publishes; outsiders cannot operate; admin stops cannot be bypassed", async () => {
      const created = await event(2, false),
        path = `/events/${created.id}/status`;
      expect(
        (await call(path, "PATCH", { status: "published" }, outsider.token))
          .status,
      ).toBe(403);
      expect(
        (await call(path, "PATCH", { status: "published" }, owner.token))
          .status,
      ).toBe(200);
      const adminPath = `/admin/events/${created.id}/status`;
      expect(
        (
          await call(
            adminPath,
            "PATCH",
            { status: "draft", reason: "Review" },
            admin.token,
          )
        ).status,
      ).toBe(200);
      expect(
        (await call(path, "PATCH", { status: "published" }, owner.token))
          .status,
      ).toBe(403);
      expect(
        (await call(adminPath, "PATCH", { status: "published" }, admin.token))
          .status,
      ).toBe(200);
      expect(
        (await call(path, "PATCH", { status: "cancelled" }, owner.token))
          .status,
      ).toBe(200);
      expect(
        (await call(path, "PATCH", { status: "draft" }, owner.token)).status,
      ).toBe(422);
      const draft = await event(2, false);
      await call(
        `/admin/events/${draft.id}/status`,
        "PATCH",
        { status: "draft" },
        admin.token,
      );
      expect(
        (
          await call(
            `/events/${draft.id}/status`,
            "PATCH",
            { status: "published" },
            owner.token,
          )
        ).status,
      ).toBe(403);
    });
    test("Japanese organizer search and Tokyo date boundaries work on a UTC database", async () => {
      const created = await event();
      await sqlClient`UPDATE events SET start_at='2090-01-01T15:30:00Z',end_at='2090-01-01T17:30:00Z',application_deadline=NULL WHERE id=${created.id}`;
      const result = await call<Array<{ id: string }>>(
        "/events?keyword=" +
          encodeURIComponent("東京要件" + prefix) +
          "&startDate=2090-01-02&endDate=2090-01-02",
      );
      expect(result.status).toBe(200);
      expect(result.data.map((row) => row.id)).toContain(created.id);
      expect(
        (
          await call<Array<{ id: string }>>(
            "/events?organizerName=" +
              encodeURIComponent("東京要件" + prefix) +
              "&startDate=2090-01-01&endDate=2090-01-01",
          )
        ).data.map((row) => row.id),
      ).not.toContain(created.id);
    });
    test("capacity increases promote oldest waiters before accepting newcomers and ranks stay current", async () => {
      const created = await event(1);
      await apply(created.id, users[0]);
      const waiting = await apply(created.id, users[1]);
      await apply(created.id, users[2]);
      const changed = await call<Event>(
        `/events/${created.id}`,
        "PATCH",
        { capacity: 2, expectedVersion: created.version },
        owner.token,
      );
      expect(changed.status).toBe(200);
      const [promoted] =
        await sqlClient`SELECT status FROM registrations WHERE id=${waiting.registrationId}`;
      expect(promoted.status).toBe("confirmed");
      expect((await apply(created.id, users[3])).status).toBe("waitlisted");
      const mine = await call<Array<{ waitlistPosition: number }>>(
        "/me/registrations",
        "GET",
        undefined,
        users[2].token,
      );
      expect(mine.data.find((row) => row.waitlistPosition === 1)).toBeDefined();
      const found = await call<Array<{ id: string }>>(
        `/events/${created.id}/registrations?keyword=${waiting.registrationId}`,
        "GET",
        undefined,
        owner.token,
      );
      expect(found.data.map((row) => row.id)).toEqual([waiting.registrationId]);
      const [history] =
        await sqlClient`SELECT count(*)::int AS count FROM registration_status_histories WHERE registration_id=${waiting.registrationId} AND to_status='confirmed'`;
      expect(history.count).toBe(1);
    });
    test("concurrent applications never exceed capacity", async () => {
      const created = await event(2);
      const results = await Promise.all(
        users.map((user) => apply(created.id, user)),
      );
      expect(results.filter((row) => row.status === "confirmed")).toHaveLength(
        2,
      );
      expect(results.filter((row) => row.status === "waitlisted")).toHaveLength(
        users.length - 2,
      );
    });
    test("failed capacity edits roll back promotions and cancelled events never promote", async () => {
      const created = await event(1);
      await apply(created.id, users[0]);
      const waiting = await apply(created.id, users[1]);
      expect(
        (
          await call(
            `/events/${created.id}`,
            "PATCH",
            {
              capacity: 2,
              tagIds: [crypto.randomUUID()],
              expectedVersion: created.version,
            },
            owner.token,
          )
        ).status,
      ).toBe(422);
      const [unchanged] =
        await sqlClient`SELECT e.capacity,r.status FROM events e JOIN registrations r ON r.event_id=e.id WHERE e.id=${created.id} AND r.id=${waiting.registrationId}`;
      expect(unchanged.capacity).toBe(1);
      expect(unchanged.status).toBe("waitlisted");
      const current = await call<Event>(
        `/events/${created.id}/status`,
        "PATCH",
        { status: "cancelled" },
        owner.token,
      );
      expect(current.status).toBe(200);
      expect(
        (
          await call(
            `/events/${created.id}`,
            "PATCH",
            { capacity: 3, expectedVersion: current.data.version },
            owner.token,
          )
        ).status,
      ).toBe(200);
      const [stillWaiting] =
        await sqlClient`SELECT status FROM registrations WHERE id=${waiting.registrationId}`;
      expect(stillWaiting.status).toBe("waitlisted");
    });
    test("optimistic editing rejects missing and stale versions; concurrent edits do not overwrite", async () => {
      const created = await event();
      expect(
        (
          await call(
            `/events/${created.id}`,
            "PATCH",
            { title: "Missing" },
            owner.token,
          )
        ).status,
      ).toBe(400);
      const changes = await Promise.all(
        ["First", "Second"].map((title) =>
          call(
            `/events/${created.id}`,
            "PATCH",
            { title, expectedVersion: created.version },
            owner.token,
          ),
        ),
      );
      expect(changes.map((row) => row.status).sort()).toEqual([200, 409]);
      expect(changes.find((row) => row.status === 409)?.error?.code).toBe(
        "VERSION_CONFLICT",
      );
      const before = await call<Event>(
        `/events/${created.id}`,
        "GET",
        undefined,
        owner.token,
      );
      expect(
        (
          await call(
            `/events/${created.id}`,
            "PATCH",
            {
              title: "Rollback",
              tagIds: [crypto.randomUUID()],
              expectedVersion: before.data.version,
            },
            owner.token,
          )
        ).status,
      ).toBe(422);
      expect(
        (
          await call<Event>(
            `/events/${created.id}`,
            "GET",
            undefined,
            owner.token,
          )
        ).data.title,
      ).toBe(before.data.title);
    });
    test("deleted active users cannot authenticate, log in or refresh", async () => {
      const session = await createRefreshSession(outsider.id);
      await sqlClient`UPDATE users SET deleted_at=now() WHERE id=${outsider.id}`;
      try {
        expect(
          (await call("/me", "GET", undefined, outsider.token)).status,
        ).toBe(401);
        expect(
          (
            await call("/auth/login", "POST", {
              email: outsider.email,
              password,
            })
          ).status,
        ).toBe(401);
        await expect(rotateRefreshSession(session.token)).rejects.toThrow();
      } finally {
        await sqlClient`UPDATE users SET deleted_at=NULL WHERE id=${outsider.id}`;
      }
    });
    test("changing forwarded headers does not bypass per-account login limit", async () => {
      const email = "nonexistent-" + prefix + "@example.test";
      for (let index = 0; index < 11; index++) {
        const result = await call(
          "/auth/login",
          "POST",
          { email, password: "wrong" },
          undefined,
          { "x-forwarded-for": "203.0.113." + index },
        );
        expect(result.status).toBe(index < 10 ? 401 : 429);
      }
    });
    test("a real HTTP login records the socket peer, not forwarded headers", async () => {
      const server = createApp().listen({ hostname: "127.0.0.1", port: 0 });
      try {
        const response = await fetch(
          `http://127.0.0.1:${server.server!.port}/api/v1/auth/login`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-forwarded-for": "203.0.113.99",
            },
            body: JSON.stringify({ email: owner.email, password }),
          },
        );
        expect(response.status).toBe(200);
        const [log] =
          await sqlClient`SELECT host(ip_address) AS ip FROM operation_logs WHERE actor_user_id=${owner.id} AND action='auth.login' ORDER BY created_at DESC LIMIT 1`;
        expect(log.ip).toBe("127.0.0.1");
      } finally {
        await server.stop();
      }
    });
    test("recommendations use attended history and hide private URLs and active registrations", async () => {
      const past = await event(),
        future = await event();
      await sqlClient`UPDATE events SET start_at=now()-interval '2 days',end_at=now()-interval '1 day',application_deadline=NULL,status='completed' WHERE id=${past.id}`;
      await sqlClient`INSERT INTO registrations(event_id,user_id,status) VALUES(${past.id},${users[4].id},'checked_in')`;
      const related = await call<Array<{ id: string; onlineUrl?: string }>>(
        "/me/recommended-events",
        "GET",
        undefined,
        users[4].token,
      );
      expect(related.status).toBe(200);
      expect(related.data.map((row) => row.id)).toContain(future.id);
      expect(related.data.some((row) => row.onlineUrl !== undefined)).toBe(
        false,
      );
      await apply(future.id, users[4]);
      expect(
        (
          await call<Array<{ id: string }>>(
            "/me/recommended-events",
            "GET",
            undefined,
            users[4].token,
          )
        ).data.map((row) => row.id),
      ).not.toContain(future.id);
      await sqlClient`UPDATE events SET status='cancelled' WHERE id=${past.id}`;
      expect(
        (
          await call<unknown[]>(
            "/me/recommended-events",
            "GET",
            undefined,
            users[4].token,
          )
        ).data,
      ).toEqual([]);
      expect(
        (
          await call<unknown[]>(
            "/me/recommended-events",
            "GET",
            undefined,
            outsider.token,
          )
        ).data,
      ).toEqual([]);
    });
    test("admin operations authorize, search, review and retain histories", async () => {
      const created = await event(),
        registration = await apply(created.id, users[0]);
      expect(
        (await call("/admin/organizers", "GET", undefined, owner.token)).status,
      ).toBe(403);
      expect(
        (await call("/admin/registrations", "GET", undefined, owner.token))
          .status,
      ).toBe(403);
      expect(
        (
          await call(
            "/admin/reviews",
            "POST",
            { targetType: "event", targetId: created.id },
            owner.token,
          )
        ).status,
      ).toBe(403);
      for (const [targetType, targetId] of [
        ["organizer", organizerId],
        ["event", created.id],
        ["registration", registration.registrationId],
      ]) {
        expect(
          (
            await call(
              "/admin/reviews",
              "POST",
              { targetType, targetId },
              admin.token,
            )
          ).status,
        ).toBe(201);
      }
      const list = await call<Array<{ id: string }>>(
        `/admin/registrations?keyword=${registration.registrationId}`,
        "GET",
        undefined,
        admin.token,
      );
      expect(list.data.map((row) => row.id)).toEqual([
        registration.registrationId,
      ]);
      for (const path of [
        `/admin/events/${created.id}`,
        `/admin/events/${created.id}/history`,
        `/admin/registrations/${registration.registrationId}`,
        `/admin/registrations/${registration.registrationId}/history`,
        `/admin/organizers/${organizerId}/history`,
        "/admin/moderation-actions",
      ]) {
        expect((await call(path, "GET", undefined, admin.token)).status).toBe(
          200,
        );
      }
      const stop = `/admin/organizers/${organizerId}/status`;
      expect(
        (
          await call(
            stop,
            "PATCH",
            { status: "suspended", reason: "Review" },
            admin.token,
          )
        ).status,
      ).toBe(200);
      expect((await call(`/events/${created.id}`)).status).toBe(404);
      expect(
        (
          await call(
            `/events/${created.id}/registrations`,
            "POST",
            {},
            users[1].token,
          )
        ).status,
      ).toBe(404);
      expect(
        (
          await call(
            stop,
            "PATCH",
            { status: "active", reason: "Restored" },
            admin.token,
          )
        ).status,
      ).toBe(200);
    });
    test("analytics use Tokyo months, distinct participants, single-count capacities and validated axes", async () => {
      const created = await event(10);
      await sqlClient`UPDATE events SET start_at='2089-12-31T15:30:00Z',end_at='2089-12-31T17:30:00Z',application_deadline=NULL WHERE id=${created.id}`;
      await apply(created.id, users[0]);
      await apply(created.id, users[1]);
      const query = `from=2090-01-01&to=2090-01-31&organizerId=${organizerId}`;
      const monthly = await call<
        Array<{ eventCount: number; participantCount: number }>
      >(
        "/admin/analytics/monthly-participants?" + query,
        "GET",
        undefined,
        admin.token,
      );
      expect(monthly.status).toBe(200);
      expect(monthly.data[0].eventCount).toBeGreaterThanOrEqual(1);
      expect(monthly.data[0].participantCount).toBe(2);
      for (const groupBy of ["category", "organizer", "format"]) {
        const groups = await call<
          Array<{ capacity: number; applicationRate: number }>
        >(
          "/admin/analytics/breakdown?" + query + "&groupBy=" + groupBy,
          "GET",
          undefined,
          admin.token,
        );
        expect(groups.status).toBe(200);
        expect(groups.data.reduce((sum, row) => sum + row.capacity, 0)).toBe(
          12,
        );
      }
      for (const name of [
        "popular-categories",
        "popular-organizers",
        "monthly-events",
      ]) {
        expect(
          (
            await call(
              "/admin/analytics/" + name + "?" + query,
              "GET",
              undefined,
              admin.token,
            )
          ).status,
        ).toBe(200);
      }
      expect(
        (
          await call(
            "/admin/analytics/breakdown?" + query + "&groupBy=invalid",
            "GET",
            undefined,
            admin.token,
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await call(
            "/admin/analytics/popular-categories?" + query + "&limit=1.5",
            "GET",
            undefined,
            admin.token,
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await call(
            "/admin/analytics/monthly-events?from=2000-01-01&to=2090-01-01",
            "GET",
            undefined,
            admin.token,
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await call(
            "/admin/analytics/monthly-events?from=2090-02-02&to=2090-01-01",
            "GET",
            undefined,
            admin.token,
          )
        ).status,
      ).toBe(400);
    });
  },
);

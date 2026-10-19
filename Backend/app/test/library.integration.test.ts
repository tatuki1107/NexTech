import { beforeAll, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { sqlClient } from "../src/db";
import { assertContract } from "./contract";
import {
  generateEventReminders,
  notifyRegistration,
} from "../src/services/notifications";

const app = createApp();
const prefix = crypto.randomUUID();
type Auth = { accessToken: string; user: { id: string } };
type Notification = {
  id: string;
  kind: string;
  title: string;
  readAt: string | null;
};
type Settings = {
  registrationUpdates: boolean;
  eventReminders: boolean;
  recommendations: boolean;
};
async function call<T = Record<string, unknown>>(
  path: string,
  method = "GET",
  body?: unknown,
  token?: string,
) {
  const response = await app.handle(
    new Request(`http://localhost/api/v1${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  const payload =
    response.status === 204
      ? null
      : ((await response.json()) as {
          data: T;
          pagination: { total: number };
          unreadCount: number;
        });
  assertContract(`/api/v1${path}`, method, response, payload);
  return { response, payload, data: payload?.data as T };
}

describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "personal library and notifications",
  () => {
    let owner: Auth, member: Auth, outsider: Auth;
    let organizerId: string, categoryId: string, eventId: string;
    beforeAll(async () => {
      const accounts: Auth[] = [];
      for (const name of [
        "library-owner",
        "library-member",
        "library-outsider",
      ]) {
        const signup = await call<Auth>("/auth/signup", "POST", {
          email: `${name}-${prefix}@example.test`,
          password: "library-test-password",
          displayName: name,
        });
        expect(signup.response.status).toBe(201);
        accounts.push(signup.data);
      }
      [owner, member, outsider] = accounts as [Auth, Auth, Auth];
      organizerId = (
        await call<{ id: string }>(
          "/organizers",
          "POST",
          { name: "Library organizer", slug: `library-${prefix}` },
          owner.accessToken,
        )
      ).data.id;
      const [category] =
        await sqlClient`INSERT INTO categories (name,slug) VALUES ('Library',${`library-${prefix}`}) RETURNING id`;
      categoryId = String(category.id);
      const event = await call<{ id: string }>(
        `/organizers/${organizerId}/events`,
        "POST",
        {
          title: "Library event",
          description: "Notification tests",
          categoryId,
          format: "online",
          onlineUrl: "https://example.test/private-meeting",
          startAt: "2035-01-02T10:00:00Z",
          endAt: "2035-01-02T12:00:00Z",
          applicationDeadline: "2035-01-02T09:30:00Z",
          capacity: 1,
          waitlistEnabled: true,
        },
        owner.accessToken,
      );
      expect(event.response.status).toBe(201);
      eventId = event.data.id;
      await sqlClient`UPDATE events SET status='published' WHERE id=${eventId}`;
    });

    test("requires authentication and validates all new query/body boundaries", async () => {
      for (const path of [
        "/me/saved-events",
        "/me/favorite-categories",
        "/me/favorite-organizers",
        "/me/organizers",
        "/me/notifications",
        "/me/notification-settings",
      ]) {
        expect((await call(path)).response.status).toBe(401);
      }
      expect(
        (
          await call(
            "/me/saved-events?page=0",
            "GET",
            undefined,
            member.accessToken,
          )
        ).response.status,
      ).toBe(400);
      expect(
        (
          await call(
            "/me/notifications?unreadOnly=garbage",
            "GET",
            undefined,
            member.accessToken,
          )
        ).response.status,
      ).toBe(400);
      expect(
        (
          await call(
            "/me/notification-settings",
            "PATCH",
            { eventReminders: null },
            member.accessToken,
          )
        ).response.status,
      ).toBe(400);
      expect(
        (
          await call(
            "/me/saved-events/not-a-uuid",
            "PUT",
            undefined,
            member.accessToken,
          )
        ).response.status,
      ).toBe(400);
    });

    test("saves idempotently, isolates users, preserves totals and rechecks visibility", async () => {
      const path = `/me/saved-events/${eventId}`;
      expect(
        (await call(path, "PUT", undefined, member.accessToken)).response
          .status,
      ).toBe(204);
      expect(
        (await call(path, "PUT", undefined, member.accessToken)).response
          .status,
      ).toBe(204);
      const saved = await call<Array<{ id: string; onlineUrl?: string }>>(
        "/me/saved-events?view=upcoming",
        "GET",
        undefined,
        member.accessToken,
      );
      expect(saved.data.map((row) => row.id)).toEqual([eventId]);
      expect(saved.data[0]!.onlineUrl).toBeUndefined();
      const beyond = await call<unknown[]>(
        "/me/saved-events?page=2&perPage=1",
        "GET",
        undefined,
        member.accessToken,
      );
      expect(beyond.data).toEqual([]);
      expect(beyond.payload!.pagination.total).toBe(1);
      expect(
        (
          await call<unknown[]>(
            "/me/saved-events",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data,
      ).toEqual([]);
      await sqlClient`UPDATE events SET visibility='private' WHERE id=${eventId}`;
      expect(
        (
          await call<unknown[]>(
            "/me/saved-events",
            "GET",
            undefined,
            member.accessToken,
          )
        ).data,
      ).toEqual([]);
      expect(
        (await call(path, "PUT", undefined, outsider.accessToken)).response
          .status,
      ).toBe(404);
      expect(
        (await call(path, "DELETE", undefined, member.accessToken)).response
          .status,
      ).toBe(204);
      expect(
        (await call(path, "DELETE", undefined, member.accessToken)).response
          .status,
      ).toBe(204);
      await sqlClient`UPDATE events SET visibility='public' WHERE id=${eventId}`;
    });

    test("lists own follows and memberships including legacy owner rows", async () => {
      await call(
        `/me/favorite-categories/${categoryId}`,
        "PUT",
        undefined,
        member.accessToken,
      );
      await call(
        `/me/favorite-organizers/${organizerId}`,
        "PUT",
        undefined,
        member.accessToken,
      );
      expect(
        (
          await call<Array<{ id: string }>>(
            "/me/favorite-categories",
            "GET",
            undefined,
            member.accessToken,
          )
        ).data.map((row) => row.id),
      ).toContain(categoryId);
      expect(
        (
          await call<Array<{ id: string }>>(
            "/me/favorite-organizers",
            "GET",
            undefined,
            member.accessToken,
          )
        ).data.map((row) => row.id),
      ).toContain(organizerId);
      expect(
        (
          await call<unknown[]>(
            "/me/favorite-organizers",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data,
      ).toEqual([]);
      await sqlClient`DELETE FROM organizer_members WHERE organizer_id=${organizerId} AND user_id=${owner.user.id}`;
      await sqlClient`INSERT INTO organizer_members (organizer_id,user_id) VALUES (${organizerId},${member.user.id})`;
      expect(
        (
          await call<Array<{ memberRole: string }>>(
            "/me/organizers",
            "GET",
            undefined,
            owner.accessToken,
          )
        ).data[0]!.memberRole,
      ).toBe("owner");
      expect(
        (
          await call<Array<{ memberRole: string }>>(
            "/me/organizers",
            "GET",
            undefined,
            member.accessToken,
          )
        ).data[0]!.memberRole,
      ).toBe("member");
      expect(
        (
          await call<unknown[]>(
            "/me/organizers",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data,
      ).toEqual([]);
      await sqlClient`DELETE FROM organizer_members WHERE organizer_id=${organizerId} AND user_id=${member.user.id}`;
    });

    test("persists partial preferences and generates registration and promotion notifications", async () => {
      const defaults = await call<Settings>(
        "/me/notification-settings",
        "GET",
        undefined,
        member.accessToken,
      );
      expect(defaults.data).toEqual({
        registrationUpdates: true,
        eventReminders: true,
        recommendations: false,
      });
      await call(
        "/me/notification-settings",
        "PATCH",
        { registrationUpdates: false },
        outsider.accessToken,
      );
      await call(
        `/events/${eventId}/registrations`,
        "POST",
        {},
        member.accessToken,
      );
      await call(
        `/events/${eventId}/registrations`,
        "POST",
        {},
        outsider.accessToken,
      );
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data,
      ).toEqual([]);
      await call(
        "/me/notification-settings",
        "PATCH",
        { registrationUpdates: true, recommendations: true },
        outsider.accessToken,
      );
      const settings = await call<Settings>(
        "/me/notification-settings",
        "PATCH",
        { eventReminders: false },
        outsider.accessToken,
      );
      expect(settings.data).toEqual({
        registrationUpdates: true,
        eventReminders: false,
        recommendations: true,
      });
      await call(
        `/events/${eventId}/registration`,
        "DELETE",
        undefined,
        member.accessToken,
      );
      const promoted = await call<Notification[]>(
        "/me/notifications",
        "GET",
        undefined,
        outsider.accessToken,
      );
      expect(
        promoted.data.some((row) => row.title.includes("参加確定")),
      ).toBeTrue();
      const notifications = await call<Notification[]>(
        "/me/notifications",
        "GET",
        undefined,
        member.accessToken,
      );
      expect(notifications.data.length).toBe(2);
      const id = notifications.data[0]!.id;
      expect(
        (
          await call(
            `/me/notifications/${id}/read`,
            "PUT",
            undefined,
            outsider.accessToken,
          )
        ).response.status,
      ).toBe(404);
      expect(
        (
          await call(
            `/me/notifications/${id}/read`,
            "PUT",
            undefined,
            member.accessToken,
          )
        ).response.status,
      ).toBe(204);
      const once = await call<Notification[]>(
        "/me/notifications",
        "GET",
        undefined,
        member.accessToken,
      );
      await call(
        `/me/notifications/${id}/read`,
        "PUT",
        undefined,
        member.accessToken,
      );
      const twice = await call<Notification[]>(
        "/me/notifications",
        "GET",
        undefined,
        member.accessToken,
      );
      expect(twice.data.find((row) => row.id === id)!.readAt).toBe(
        once.data.find((row) => row.id === id)!.readAt,
      );
      await call(
        "/me/notifications/read-all",
        "PUT",
        undefined,
        member.accessToken,
      );
      const unread = await call<Notification[]>(
        "/me/notifications?unreadOnly=true",
        "GET",
        undefined,
        member.accessToken,
      );
      expect(unread.data).toEqual([]);
      expect(unread.payload!.unreadCount).toBe(0);
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).payload!.unreadCount,
      ).toBe(1);
    });

    test("reminders honor preferences, confirmed status, event state and retry deduplication", async () => {
      const now = new Date("2035-01-01T10:01:00Z");
      await generateEventReminders(now);
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data.filter((row) => row.kind === "reminder"),
      ).toHaveLength(0);
      await call(
        "/me/notification-settings",
        "PATCH",
        { eventReminders: true },
        outsider.accessToken,
      );
      await generateEventReminders(now);
      await generateEventReminders(now);
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data.filter((row) => row.kind === "reminder"),
      ).toHaveLength(1);
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            member.accessToken,
          )
        ).data.filter((row) => row.kind === "reminder"),
      ).toHaveLength(0);
      await sqlClient`UPDATE events SET status='cancelled' WHERE id=${eventId}`;
      await generateEventReminders(new Date("2035-01-02T09:01:00Z"));
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data.filter((row) => row.kind === "reminder"),
      ).toHaveLength(1);
      await sqlClient`UPDATE events SET status='published' WHERE id=${eventId}`;
      await generateEventReminders(new Date("2035-01-02T09:01:00Z"));
      await generateEventReminders(new Date("2035-01-02T09:01:00Z"));
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data.filter((row) => row.kind === "reminder"),
      ).toHaveLength(2);
    });

    test("rolls back notifications together with the business transaction", async () => {
      await expect(
        sqlClient.begin(async (tx) => {
          await notifyRegistration(tx, {
            userId: member.user.id,
            eventId,
            title: "Rolled back",
            message: "Must not be delivered",
          });
          throw new Error("intentional rollback");
        }),
      ).rejects.toThrow("intentional rollback");
      const rows =
        await sqlClient`SELECT id FROM user_notifications WHERE user_id=${member.user.id} AND title='Rolled back'`;
      expect(rows).toHaveLength(0);
    });

    test("publishing notifies opted-in followers once, never outsiders or private events", async () => {
      await call(
        "/me/notification-settings",
        "PATCH",
        { recommendations: true },
        member.accessToken,
      );
      await sqlClient`INSERT INTO user_roles (user_id,role_code) VALUES (${owner.user.id},'admin')`;
      for (let index = 0; index < 2; index++) {
        await call(
          `/admin/events/${eventId}/status`,
          "PATCH",
          { status: "draft", reason: "Integration review" },
          owner.accessToken,
        );
        await call(
          `/admin/events/${eventId}/status`,
          "PATCH",
          { status: "published", reason: "Integration publication" },
          owner.accessToken,
        );
      }
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            member.accessToken,
          )
        ).data.filter((row) => row.kind === "recommendation"),
      ).toHaveLength(1);
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            outsider.accessToken,
          )
        ).data.filter((row) => row.kind === "recommendation"),
      ).toHaveLength(0);
      await sqlClient`DELETE FROM user_notifications WHERE event_id=${eventId} AND kind='recommendation'`;
      await sqlClient`UPDATE events SET status='draft',visibility='private' WHERE id=${eventId}`;
      await call(
        `/admin/events/${eventId}/status`,
        "PATCH",
        { status: "published", reason: "Integration publication" },
        owner.accessToken,
      );
      expect(
        (
          await call<Notification[]>(
            "/me/notifications",
            "GET",
            undefined,
            member.accessToken,
          )
        ).data.filter((row) => row.kind === "recommendation"),
      ).toHaveLength(0);
    });

    test("event cancellation notifies participants once", async () => {
      for (let index = 0; index < 2; index++) {
        const result = await call(
          `/admin/events/${eventId}/status`,
          "PATCH",
          { status: "cancelled", reason: "Integration cancellation" },
          owner.accessToken,
        );
        expect(result.response.status).toBe(200);
      }
      const result = await call<Notification[]>(
        "/me/notifications",
        "GET",
        undefined,
        outsider.accessToken,
      );
      expect(
        result.data.filter((row) => row.title === "イベントが中止されました"),
      ).toHaveLength(1);
      const cancelled = await call<Notification[]>(
        "/me/notifications",
        "GET",
        undefined,
        member.accessToken,
      );
      expect(
        cancelled.data.filter(
          (row) => row.title === "イベントが中止されました",
        ),
      ).toHaveLength(0);
    });
  },
);

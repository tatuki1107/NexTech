import { beforeAll, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { sqlClient } from "../src/db";
import { createAccessToken } from "../src/lib/auth";
import { generateEventReminders } from "../src/services/notifications";

const app = createApp();
const prefix = crypto.randomUUID();
async function call(
  path: string,
  method = "GET",
  token?: string,
  body?: unknown,
) {
  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
  };
}

describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "API internal regressions",
  () => {
    let owner: string,
      first: string,
      second: string,
      ownerToken: string,
      firstToken: string;
    let organizerId: string, categoryId: string, eventId: string;
    const createEvent = async (status = "published", past = false) => {
      const [event] = await sqlClient`INSERT INTO events
      (organizer_id,category_id,created_by,title,description,format,venue_name,timezone,start_at,end_at,capacity,status,waitlist_enabled)
      VALUES (${organizerId},${categoryId},${owner},'Regression event','Test fixture','offline','Test hall','Asia/Tokyo',
        ${past ? "2000-01-01T10:00:00Z" : "2099-01-01T10:00:00Z"},${past ? "2000-01-01T12:00:00Z" : "2099-01-01T12:00:00Z"},1,${status},true) RETURNING id`;
      return String(event.id);
    };
    const registerPair = async (id: string) => {
      await sqlClient`INSERT INTO registrations (event_id,user_id,status) VALUES (${id},${first},'confirmed')`;
      await sqlClient`INSERT INTO registrations (event_id,user_id,status,waitlist_position) VALUES (${id},${second},'waitlisted',1)`;
    };
    beforeAll(async () => {
      const ids: string[] = [];
      for (let index = 0; index < 3; index++) {
        const [user] =
          await sqlClient`INSERT INTO users(email,password_hash,display_name) VALUES (${`regression-${index}-${prefix}@example.test`},'unused','Regression') RETURNING id`;
        ids.push(String(user.id));
        await sqlClient`INSERT INTO user_roles(user_id,role_code) VALUES (${user.id},${index === 0 ? "admin" : "participant"})`;
      }
      [owner, first, second] = ids as [string, string, string];
      ownerToken = await createAccessToken(owner);
      firstToken = await createAccessToken(first);
      const [organizer] =
        await sqlClient`INSERT INTO organizers(owner_user_id,name,slug) VALUES (${owner},'Regression organizer',${prefix}) RETURNING id`;
      organizerId = String(organizer.id);
      const [category] =
        await sqlClient`INSERT INTO categories(name,slug) VALUES ('Regression',${prefix}) RETURNING id`;
      categoryId = String(category.id);
      eventId = await createEvent();
      await registerPair(eventId);
    });

    test("valid single and multiple UUID tag filters work", async () => {
      const tags: string[] = [];
      for (let index = 0; index < 2; index++) {
        const [tag] =
          await sqlClient`INSERT INTO tags(name,slug) VALUES ('Regression',${`${prefix}-${index}`}) RETURNING id`;
        tags.push(String(tag.id));
      }
      const otherEvent = await createEvent();
      await sqlClient`INSERT INTO event_tags(event_id,tag_id) VALUES (${eventId},${tags[0]}),(${otherEvent},${tags[1]})`;
      const single = await call(`/api/v1/events?tagIds=${tags[0]}`);
      expect(single.status).toBe(200);
      expect(single.body.data.map((row: { id: string }) => row.id)).toEqual([
        eventId,
      ]);
      const multiple = await call(`/api/v1/events?tagIds=${tags.join(",")}`);
      expect(multiple.status).toBe(200);
      expect(multiple.body.pagination.total).toBe(2);
      const missing = await call(
        `/api/v1/events?tagIds=${crypto.randomUUID()}`,
      );
      expect(missing.status).toBe(200);
      expect(missing.body.data).toEqual([]);
    });

    test("every window-count list retains filtered totals beyond the last page", async () => {
      const paths: Array<[string, string | undefined]> = [
        [`/api/v1/events?organizerId=${organizerId}`, undefined],
        ["/api/v1/me/registrations?view=upcoming", firstToken],
        [
          `/api/v1/organizers/${organizerId}/events?status=published`,
          ownerToken,
        ],
        [
          `/api/v1/events/${eventId}/registrations?status=confirmed&keyword=Regression`,
          ownerToken,
        ],
        ["/api/v1/admin/events?status=published", ownerToken],
      ];
      for (const [path, token] of paths) {
        const initial = await call(`${path}&page=1&perPage=1`, "GET", token);
        const beyond = await call(`${path}&page=99999&perPage=1`, "GET", token);
        expect(initial.status).toBe(200);
        expect(initial.body.pagination.total).toBeGreaterThan(0);
        expect(beyond.status).toBe(200);
        expect(beyond.body.data).toEqual([]);
        expect(beyond.body.pagination.total).toBe(
          initial.body.pagination.total,
        );
      }
    });

    test("cancellation of a cancelled event never promotes waitlisted users", async () => {
      const id = await createEvent("cancelled");
      await registerPair(id);
      expect(
        (await call(`/api/v1/events/${id}/registration`, "DELETE", firstToken))
          .status,
      ).toBe(200);
      const [waiting] =
        await sqlClient`SELECT status FROM registrations WHERE event_id=${id} AND user_id=${second}`;
      expect(waiting.status).toBe("waitlisted");
      const notices =
        await sqlClient`SELECT id FROM user_notifications WHERE event_id=${id} AND user_id=${second}`;
      expect(notices).toHaveLength(0);
    });

    test("started events cannot be cancelled and check-in requires a published event", async () => {
      const started = await createEvent("published", true);
      await registerPair(started);
      expect(
        (
          await call(
            `/api/v1/events/${started}/registration`,
            "DELETE",
            firstToken,
          )
        ).status,
      ).toBe(422);
      const [unchanged] =
        await sqlClient`SELECT status FROM registrations WHERE event_id=${started} AND user_id=${first}`;
      expect(unchanged.status).toBe("confirmed");
      for (const state of ["cancelled", "completed", "draft"]) {
        const id = await createEvent(state);
        await registerPair(id);
        const [registration] =
          await sqlClient`SELECT id FROM registrations WHERE event_id=${id} AND user_id=${first}`;
        expect(
          (
            await call(
              `/api/v1/events/${id}/registrations/${registration.id}/check-in`,
              "POST",
              ownerToken,
              {},
            )
          ).status,
        ).toBe(422);
        const [current] =
          await sqlClient`SELECT status FROM registrations WHERE id=${registration.id}`;
        expect(current.status).toBe("confirmed");
      }
    });

    test("cancelled events cannot be reopened through an intermediate draft", async () => {
      const id = await createEvent("cancelled");
      expect(
        (
          await call(`/api/v1/admin/events/${id}/status`, "PATCH", ownerToken, {
            status: "draft",
          })
        ).status,
      ).toBe(422);
      const [current] =
        await sqlClient`SELECT status FROM events WHERE id=${id}`;
      expect(current.status).toBe("cancelled");
    });

    test("suspended organizers are hidden from both public APIs and reject new applications", async () => {
      const [other] =
        await sqlClient`INSERT INTO users(email,password_hash,display_name) VALUES (${`${prefix}-outsider@example.test`},'unused','Outsider') RETURNING id`;
      const token = await createAccessToken(String(other.id));
      await sqlClient`UPDATE organizers SET status='suspended' WHERE id=${organizerId}`;
      try {
        expect((await call(`/api/v1/events/${eventId}`)).status).toBe(404);
        expect((await call(`/api/events/${eventId}`)).status).toBe(404);
        expect(
          (await call(`/api/v1/events?organizerId=${organizerId}`)).body.data,
        ).toEqual([]);
        expect(
          (await call("/api/events")).body.events.some(
            (row: { id: string }) => row.id === eventId,
          ),
        ).toBeFalse();
        expect(
          (
            await call(
              `/api/v1/events/${eventId}/registrations`,
              "POST",
              token,
              {},
            )
          ).status,
        ).toBe(404);
        await sqlClient`INSERT INTO organizer_members(organizer_id,user_id) VALUES (${organizerId},${first})`;
        expect(
          (
            await call(
              `/api/v1/organizers/${organizerId}/events`,
              "GET",
              firstToken,
            )
          ).status,
        ).toBe(403);
        const [registration] =
          await sqlClient`SELECT id FROM registrations WHERE event_id=${eventId} AND user_id=${first}`;
        expect(
          (
            await call(
              `/api/v1/events/${eventId}/registrations/${registration.id}/check-in`,
              "POST",
              ownerToken,
              {},
            )
          ).status,
        ).toBe(422);
        const draft = await createEvent("draft");
        expect(
          (
            await call(
              `/api/v1/admin/events/${draft}/status`,
              "PATCH",
              ownerToken,
              { status: "published" },
            )
          ).status,
        ).toBe(422);
        await generateEventReminders(new Date("2098-12-31T10:01:00Z"));
        expect(
          await sqlClient`SELECT id FROM user_notifications WHERE event_id=${eventId} AND kind='reminder'`,
        ).toHaveLength(0);
        expect(
          (
            await call(
              `/api/v1/events/${eventId}/registration`,
              "DELETE",
              firstToken,
            )
          ).status,
        ).toBe(200);
        const [waiting] =
          await sqlClient`SELECT status FROM registrations WHERE event_id=${eventId} AND user_id=${second}`;
        expect(waiting.status).toBe("waitlisted");
      } finally {
        await sqlClient`UPDATE organizers SET status='active' WHERE id=${organizerId}`;
      }
    });

    test("legacy invalid UUID returns a public validation error", async () => {
      const result = await call("/api/events/not-a-uuid");
      expect(result.status).toBe(400);
      expect(result.body.error.code).toBe("VALIDATION_ERROR");
      expect(JSON.stringify(result.body)).not.toContain("SELECT");
    });

    test("oversized pagination is rejected before it reaches PostgreSQL", async () => {
      expect((await call("/api/v1/events?page=1e100")).status).toBe(400);
      expect(
        (await call("/api/v1/events?page=9007199254740991&perPage=100")).status,
      ).toBe(400);
    });
  },
);

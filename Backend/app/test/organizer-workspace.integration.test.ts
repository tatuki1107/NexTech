import { beforeAll, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { sqlClient } from "../src/db";
import { createAccessToken } from "../src/lib/auth";
const app = createApp();
async function call(
  path: string,
  token?: string,
  method = "GET",
  body?: unknown,
) {
  const response = await app.handle(
    new Request("http://localhost/api/v1" + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: "Bearer " + token } : {}),
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
  "organizer workspace integration",
  () => {
    let owner: string,
      member: string,
      outsider: string,
      ownerToken: string,
      memberToken: string,
      outsiderToken: string,
      org: string,
      otherOrg: string,
      category: string,
      draft: string,
      first: string;
    const prefix = crypto.randomUUID();
    beforeAll(async () => {
      const users: string[] = [];
      for (let index = 0; index < 3; index++) {
        const [row] =
          await sqlClient`INSERT INTO users(email,password_hash,display_name) VALUES(${"workspace-" + prefix + "-" + index + "@example.test"},'unused','Workspace member') RETURNING id`;
        users.push(String(row.id));
        await sqlClient`INSERT INTO user_roles(user_id,role_code) VALUES(${row.id},'participant')`;
      }
      [owner, member, outsider] = users as [string, string, string];
      ownerToken = await createAccessToken(owner);
      memberToken = await createAccessToken(member);
      outsiderToken = await createAccessToken(outsider);
      const [organization] =
        await sqlClient`INSERT INTO organizers(owner_user_id,name,slug,website_url,contact_email) VALUES(${owner},'Workspace',${prefix},'https://example.test','workspace@example.test') RETURNING id`;
      org = String(organization.id);
      await sqlClient`INSERT INTO organizer_members(organizer_id,user_id,member_role) VALUES(${org},${member},'member')`;
      const [other] =
        await sqlClient`INSERT INTO organizers(owner_user_id,name,slug) VALUES(${outsider},'Other',${"other-" + prefix}) RETURNING id`;
      otherOrg = String(other.id);
      const [cat] =
        await sqlClient`INSERT INTO categories(name,slug) VALUES('Workspace',${prefix}) RETURNING id`;
      category = String(cat.id);
      const created = await call(
        "/organizers/" + org + "/events",
        ownerToken,
        "POST",
        { title: "Private draft", onlineUrl: "https://example.test/private" },
      );
      expect(created.status).toBe(201);
      draft = created.body.data.id;
      const ids: string[] = [];
      for (const start of [
        "2098-12-31T15:00:00Z",
        "2099-01-01T01:00:00Z",
        "2099-01-01T15:00:00Z",
      ]) {
        const [event] =
          await sqlClient`INSERT INTO events(organizer_id,created_by,category_id,title,description,format,venue_name,timezone,start_at,end_at,capacity,status) VALUES(${org},${owner},${category},'Analytics','Content','offline','Hall','Asia/Tokyo',${start},${new Date(new Date(start).getTime() + 3600000).toISOString()},20,'published') RETURNING id`;
        ids.push(String(event.id));
      }
      first = ids[0];
      await sqlClient`INSERT INTO registrations(event_id,user_id,status) VALUES(${ids[0]},${owner},'confirmed'),(${ids[1]},${owner},'confirmed'),(${ids[0]},${member},'checked_in'),(${ids[1]},${outsider},'cancelled'),(${ids[2]},${outsider},'confirmed')`;
    });
    test("lists paginated memberships including legacy owners and real contact fields", async () => {
      const result = await call("/me/organizers?perPage=1&page=1", ownerToken);
      expect(result.status).toBe(200);
      expect(result.body.pagination.total).toBe(1);
      expect(result.body.data[0]).toMatchObject({
        id: org,
        memberRole: "owner",
        websiteUrl: "https://example.test",
        contactEmail: "workspace@example.test",
      });
    });
    test("requires authentication and rejects outsiders for every private workspace route", async () => {
      for (const path of [
        "/members",
        "/events/" + draft,
        "/analytics?from=2099-01-01&to=2099-01-01",
      ]) {
        expect((await call("/organizers/" + org + path)).status).toBe(401);
        expect(
          (await call("/organizers/" + org + path, outsiderToken)).status,
        ).toBe(403);
      }
    });
    test("returns actual members exactly once, including an owner without a membership row", async () => {
      const response = await call(
        "/organizers/" + org + "/members",
        memberToken,
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(
        response.body.data.find((r: { id: string }) => r.id === owner).role,
      ).toBe("owner");
      expect(
        response.body.data.find((r: { id: string }) => r.id === member).role,
      ).toBe("member");
    });
    test("private detail resolves a draft and rejects mismatched organizer IDs", async () => {
      expect((await call("/events/" + draft, ownerToken)).status).toBe(404);
      const response = await call(
        "/organizers/" + org + "/events/" + draft,
        ownerToken,
      );
      expect(response.status).toBe(200);
      expect(response.body.data.onlineUrl).toBe("https://example.test/private");
      expect(
        (
          await call(
            "/organizers/" + otherOrg + "/events/" + draft,
            outsiderToken,
          )
        ).status,
      ).toBe(404);
    });
    test("analytics scope, Tokyo boundaries, cancellation and distinct repeat participants are correct", async () => {
      const result = await call(
        "/organizers/" + org + "/analytics?from=2099-01-01&to=2099-01-01",
        ownerToken,
      );
      expect(result.status).toBe(200);
      expect(result.body.data.summary).toEqual({
        totalCount: 4,
        registrationCount: 3,
        cancelledCount: 1,
        confirmedCount: 3,
        attendedCount: 1,
        participantCount: 2,
        repeatParticipantCount: 1,
      });
      expect(result.body.data.months[0]).toMatchObject({
        month: "2099-01",
        eventCount: 2,
        registrationCount: 3,
      });
      expect(result.body.data.categories[0]).toMatchObject({
        categoryId: category,
        capacity: 40,
        participantCount: 2,
      });
      expect(
        (
          await call(
            "/organizers/" + org + "/analytics?from=2099-02-01&to=2099-01-01",
            ownerToken,
          )
        ).status,
      ).toBe(400);
    });
    test("draft fields can be explicitly cleared while published event and seat constraints remain enforced", async () => {
      const current = await call(
        "/organizers/" + org + "/events/" + draft,
        ownerToken,
      );
      const cleared = await call("/events/" + draft, ownerToken, "PATCH", {
        expectedVersion: current.body.data.version,
        description: "",
        categoryId: null,
        format: null,
        startAt: null,
        endAt: null,
        capacity: null,
        applicationStartAt: null,
        applicationDeadline: null,
        onlineUrl: null,
      });
      expect(cleared.status).toBe(200);
      expect(cleared.body.data.onlineUrl).toBeNull();
      expect(cleared.body.data.capacity).toBeNull();
      expect(
        (
          await call("/events/" + draft + "/status", ownerToken, "PATCH", {
            status: "published",
          })
        ).status,
      ).toBe(422);
      const published = await call(
        "/organizers/" + org + "/events/" + first,
        ownerToken,
      );
      expect(
        (
          await call("/events/" + first, ownerToken, "PATCH", {
            expectedVersion: published.body.data.version,
            capacity: null,
          })
        ).status,
      ).toBe(422);
      expect(
        (
          await call("/events/" + first, ownerToken, "PATCH", {
            expectedVersion: published.body.data.version,
            description: "",
          })
        ).status,
      ).toBe(422);
      expect(
        (await call("/organizers/" + org + "/events/" + first, ownerToken)).body
          .data.version,
      ).toBe(published.body.data.version);
    });
  },
);

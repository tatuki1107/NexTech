import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser } from "../lib/auth";
import { pagination, UUID_PATTERN } from "../lib/validation";
import { getEventById, EVENT_SELECT_SQL } from "../services/events";

const pageQuery = {
  page: t.Optional(t.Numeric()),
  perPage: t.Optional(t.Numeric()),
};

// A saved event never grants visibility: re-check access whenever it is listed.
const savedVisibility = `e.status IN ('published','completed','cancelled') AND o.status='active' AND
  (e.visibility <> 'private' OR EXISTS (SELECT 1 FROM organizers own WHERE own.id=e.organizer_id AND own.owner_user_id=$1)
    OR EXISTS (SELECT 1 FROM organizer_members m WHERE m.organizer_id=e.organizer_id AND m.user_id=$1)
    OR $2::boolean)`;

export const meLibraryRoutes = new Elysia({ prefix: "/me" })
  .get(
    "/saved-events",
    async ({ headers, query }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      const { page, perPage, offset } = pagination(query.page, query.perPage);
      const values = [user.id, user.roles.includes("admin")];
      const view =
        query.view === "past"
          ? "AND e.start_at < now()"
          : query.view === "upcoming"
            ? "AND e.start_at >= now()"
            : "";
      const from = `FROM user_saved_events saved JOIN events e ON e.id=saved.event_id
      JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
      WHERE saved.user_id=$1 AND ${savedVisibility} ${view}`;
      const [count] = await sqlClient.unsafe(
        `SELECT count(*)::int AS total ${from}`,
        values,
      );
      const rows = await sqlClient.unsafe(
        `${EVENT_SELECT_SQL},saved.created_at AS "savedAt",
      (SELECT status FROM registrations r WHERE r.event_id=e.id AND r.user_id=$1 AND r.status<>'cancelled') AS "registrationStatus"
      ${from} ORDER BY saved.created_at DESC,e.id LIMIT $3 OFFSET $4`,
        [...values, perPage, offset],
      );
      return {
        data: rows.map((row: Record<string, unknown>) => {
          const {
            onlineUrl: _onlineUrl,
            description: _description,
            ...item
          } = row;
          return item;
        }),
        pagination: { page, perPage, total: Number(count.total) },
      };
    },
    {
      query: t.Object({
        ...pageQuery,
        view: t.Optional(t.Union([t.Literal("upcoming"), t.Literal("past")])),
      }),
    },
  )
  .put(
    "/saved-events/:eventId",
    async ({ headers, params, set }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      await getEventById(params.eventId, user);
      await sqlClient`INSERT INTO user_saved_events (user_id,event_id) VALUES (${user.id},${params.eventId}) ON CONFLICT DO NOTHING`;
      set.status = 204;
    },
    { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }) },
  )
  .delete(
    "/saved-events/:eventId",
    async ({ headers, params, set }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      await sqlClient`DELETE FROM user_saved_events WHERE user_id=${user.id} AND event_id=${params.eventId}`;
      set.status = 204;
    },
    { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }) },
  )
  .get(
    "/favorite-categories",
    async ({ headers, query }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      const { page, perPage, offset } = pagination(query.page, query.perPage);
      const [count] =
        await sqlClient`SELECT count(*)::int AS total FROM user_favorite_categories WHERE user_id=${user.id}`;
      const rows =
        await sqlClient`SELECT c.id,c.name,c.slug,c.status,f.created_at AS "followedAt"
      FROM user_favorite_categories f JOIN categories c ON c.id=f.category_id WHERE f.user_id=${user.id}
      ORDER BY f.created_at DESC,c.id LIMIT ${perPage} OFFSET ${offset}`;
      return {
        data: rows,
        pagination: { page, perPage, total: Number(count.total) },
      };
    },
    { query: t.Object(pageQuery) },
  )
  .get(
    "/favorite-organizers",
    async ({ headers, query }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      const { page, perPage, offset } = pagination(query.page, query.perPage);
      const [count] =
        await sqlClient`SELECT count(*)::int AS total FROM user_favorite_organizers WHERE user_id=${user.id}`;
      const rows =
        await sqlClient`SELECT o.id,o.name,o.slug,o.description,o.website_url AS "websiteUrl",o.status,f.created_at AS "followedAt"
      FROM user_favorite_organizers f JOIN organizers o ON o.id=f.organizer_id WHERE f.user_id=${user.id}
      ORDER BY f.created_at DESC,o.id LIMIT ${perPage} OFFSET ${offset}`;
      return {
        data: rows,
        pagination: { page, perPage, total: Number(count.total) },
      };
    },
    { query: t.Object(pageQuery) },
  )
  .get(
    "/organizers",
    async ({ headers, query }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      const { page, perPage, offset } = pagination(query.page, query.perPage);
      const [count] =
        await sqlClient`SELECT count(*)::int AS total FROM organizers o
      WHERE o.owner_user_id=${user.id} OR EXISTS (SELECT 1 FROM organizer_members m WHERE m.organizer_id=o.id AND m.user_id=${user.id})`;
      const rows =
        await sqlClient`SELECT o.id,o.name,o.slug,o.description,o.status,
      CASE WHEN o.owner_user_id=${user.id} THEN 'owner' ELSE m.member_role END AS "memberRole"
      FROM organizers o LEFT JOIN organizer_members m ON m.organizer_id=o.id AND m.user_id=${user.id}
      WHERE o.owner_user_id=${user.id} OR m.user_id=${user.id}
      ORDER BY o.name,o.id LIMIT ${perPage} OFFSET ${offset}`;
      return {
        data: rows,
        pagination: { page, perPage, total: Number(count.total) },
      };
    },
    { query: t.Object(pageQuery) },
  );

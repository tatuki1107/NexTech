import { Elysia, t } from "elysia";
import { getCurrentUser, requireRole } from "../lib/auth";
import {
  pagination,
  UUID_PATTERN,
  escapeLike,
  assertDateRange,
} from "../lib/validation";
import { EVENT_SELECT_SQL, getEventById } from "../services/events";
import { changeEventStatus } from "../services/event-status";
import { queryPage } from "../db/pagination";

const statusSchema = t.Union([
  t.Literal("draft"),
  t.Literal("published"),
  t.Literal("cancelled"),
  t.Literal("completed"),
]);
export const adminRoutes = new Elysia({ prefix: "/admin" })
  .get(
    "/events",
    async ({ headers, query }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      requireRole(user, "admin");
      if (query.from) assertDateRange(query.from, query.from);
      if (query.to) assertDateRange(query.to, query.to);
      if (query.from && query.to) assertDateRange(query.from, query.to);
      const values: unknown[] = [],
        clauses: string[] = [];
      const add = (expression: string, value: unknown) => {
        values.push(value);
        clauses.push(expression.replace("?", `$${values.length}`));
      };
      if (query.status) add("e.status=?", query.status);
      if (query.organizerId) add("e.organizer_id=?::uuid", query.organizerId);
      if (query.keyword)
        add("(e.title||' '||o.name) ILIKE ?", `%${escapeLike(query.keyword)}%`);
      if (query.from)
        add(
          "e.start_at>=(?::date::timestamp AT TIME ZONE 'Asia/Tokyo')",
          query.from,
        );
      if (query.to)
        add(
          "e.start_at<((?::date+interval '1 day') AT TIME ZONE 'Asia/Tokyo')",
          query.to,
        );
      return queryPage(
        `${EVENT_SELECT_SQL},NULL::text AS "registrationStatus",count(*) OVER()::int AS total,
    (SELECT max(m.created_at) FROM moderation_actions m WHERE m.target_type='event' AND m.target_id=e.id AND m.action='reviewed') AS "reviewedAt"
    FROM events e LEFT JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
    ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY e.created_at DESC,e.id`,
        values,
        pagination(query.page, query.perPage),
      );
    },
    {
      query: t.Object({
        status: t.Optional(statusSchema),
        organizerId: t.Optional(t.String({ pattern: UUID_PATTERN })),
        keyword: t.Optional(t.String({ maxLength: 200 })),
        from: t.Optional(t.String({ format: "date" })),
        to: t.Optional(t.String({ format: "date" })),
        page: t.Optional(t.Numeric()),
        perPage: t.Optional(t.Numeric()),
      }),
    },
  )
  .get(
    "/events/:eventId",
    async ({ headers, params }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      requireRole(user, "admin");
      return { data: await getEventById(params.eventId, user, true) };
    },
    { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }) },
  )
  .patch(
    "/events/:eventId/status",
    async ({ headers, params, body }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      requireRole(user, "admin");
      await changeEventStatus(
        params.eventId,
        user.id,
        body.status,
        body.reason,
        true,
      );
      return { data: await getEventById(params.eventId, user, true) };
    },
    {
      params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }),
      body: t.Object({
        status: statusSchema,
        reason: t.Optional(t.String({ maxLength: 1000 })),
      }),
    },
  );

import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { queryPage } from "../db/pagination";
import { getCurrentUser, requireRole } from "../lib/auth";
import { notFound } from "../lib/errors";
import {
  pagination,
  UUID_PATTERN,
  escapeLike,
  assertDateRange,
} from "../lib/validation";
import { WAITLIST_RANK_SQL } from "../services/registrations";

const pageFields = {
  page: t.Optional(t.Numeric()),
  perPage: t.Optional(t.Numeric()),
};
const organizerParams = t.Object({
  organizerId: t.String({ pattern: UUID_PATTERN }),
});
const registrationParams = t.Object({
  registrationId: t.String({ pattern: UUID_PATTERN }),
});
const targetType = t.Union([
  t.Literal("organizer"),
  t.Literal("event"),
  t.Literal("registration"),
]);
const organizerStatus = t.Union([
  t.Literal("active"),
  t.Literal("inactive"),
  t.Literal("suspended"),
]);
const registrationStatus = t.Union(
  [
    "pending",
    "confirmed",
    "waitlisted",
    "cancelled",
    "checked_in",
    "no_show",
  ].map((value) => t.Literal(value)),
);
const requireAdmin = async (authorization?: string) => {
  const user = (await getCurrentUser(authorization))!;
  requireRole(user, "admin");
  return user;
};
const ensureTarget = async (
  type: "organizer" | "event" | "registration",
  id: string,
) => {
  const table = {
    organizer: "organizers",
    event: "events",
    registration: "registrations",
  }[type];
  if (
    !(await sqlClient.unsafe(`SELECT id FROM ${table} WHERE id=$1`, [id]))
      .length
  )
    throw notFound("対象が見つかりません");
};
const organizerSelect = `SELECT o.id,o.owner_user_id AS "ownerUserId",o.name,o.slug,o.description,o.website_url AS "websiteUrl",o.contact_email AS "contactEmail",o.status,
 o.created_at AS "createdAt",o.updated_at AS "updatedAt",
 (SELECT max(m.created_at) FROM moderation_actions m WHERE m.target_type='organizer' AND m.target_id=o.id AND m.action='reviewed') AS "reviewedAt"`;
const registrationSelect = `SELECT r.id,r.event_id AS "eventId",r.user_id AS "userId",r.status,${WAITLIST_RANK_SQL} AS "waitlistPosition",
 r.applied_at AS "appliedAt",r.confirmed_at AS "confirmedAt",r.cancelled_at AS "cancelledAt",r.checked_in_at AS "checkedInAt",r.updated_at AS "updatedAt",
 jsonb_build_object('id',u.id,'email',u.email,'displayName',u.display_name,'fullName',u.full_name) AS user,
 jsonb_build_object('id',e.id,'title',e.title,'organizerId',e.organizer_id,'startAt',e.start_at,'status',e.status) AS event,
 (SELECT max(m.created_at) FROM moderation_actions m WHERE m.target_type='registration' AND m.target_id=r.id AND m.action='reviewed') AS "reviewedAt"`;

export const adminOperationsRoutes = new Elysia({ prefix: "/admin" })
  .get(
    "/organizers",
    async ({ headers, query }) => {
      await requireAdmin(headers.authorization);
      const values: unknown[] = [],
        clauses: string[] = [];
      if (query.from && query.to) assertDateRange(query.from, query.to);
      if (query.from) {
        assertDateRange(query.from, query.from);
        values.push(query.from);
        clauses.push(
          `o.created_at>=($${values.length}::date::timestamp AT TIME ZONE 'Asia/Tokyo')`,
        );
      }
      if (query.to) {
        assertDateRange(query.to, query.to);
        values.push(query.to);
        clauses.push(
          `o.created_at<(($${values.length}::date+interval '1 day') AT TIME ZONE 'Asia/Tokyo')`,
        );
      }
      if (query.status) {
        values.push(query.status);
        clauses.push(`o.status=$${values.length}`);
      }
      if (query.keyword) {
        values.push(`%${escapeLike(query.keyword)}%`);
        clauses.push(`(o.name||' '||o.slug) ILIKE $${values.length}`);
      }
      return queryPage(
        `${organizerSelect},count(*) OVER()::int AS total FROM organizers o ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY o.created_at DESC,o.id`,
        values,
        pagination(query.page, query.perPage),
      );
    },
    {
      query: t.Object({
        ...pageFields,
        status: t.Optional(organizerStatus),
        keyword: t.Optional(t.String({ maxLength: 200 })),
        from: t.Optional(t.String({ format: "date" })),
        to: t.Optional(t.String({ format: "date" })),
      }),
    },
  )
  .get(
    "/organizers/:organizerId",
    async ({ headers, params }) => {
      await requireAdmin(headers.authorization);
      const [row] = await sqlClient.unsafe(
        `${organizerSelect} FROM organizers o WHERE o.id=$1`,
        [params.organizerId],
      );
      if (!row) throw notFound("主催者が見つかりません");
      return { data: row };
    },
    { params: organizerParams },
  )
  .patch(
    "/organizers/:organizerId/status",
    async ({ headers, params, body }) => {
      const actor = await requireAdmin(headers.authorization);
      const result = await sqlClient.begin(async (tx) => {
        const [current] =
          await tx`SELECT status FROM organizers WHERE id=${params.organizerId} FOR UPDATE`;
        if (!current) throw notFound("主催者が見つかりません");
        if (current.status !== body.status) {
          await tx`UPDATE organizers SET status=${body.status},updated_at=now() WHERE id=${params.organizerId}`;
          await tx`INSERT INTO moderation_actions(actor_user_id,target_type,target_id,action,reason,metadata)
      VALUES(${actor.id},'organizer',${params.organizerId},${body.status},${body.reason},${JSON.stringify({ fromStatus: current.status, status: body.status })}::jsonb)`;
        }
        return { id: params.organizerId, status: body.status };
      });
      return { data: result };
    },
    {
      params: organizerParams,
      body: t.Object({
        status: organizerStatus,
        reason: t.String({ minLength: 1, maxLength: 1000 }),
      }),
    },
  )
  .get(
    "/organizers/:organizerId/history",
    async ({ headers, params, query }) => {
      await requireAdmin(headers.authorization);
      await ensureTarget("organizer", params.organizerId);
      return queryPage(
        `SELECT id,actor_user_id AS "actorUserId",action,reason,metadata,created_at AS "createdAt",count(*) OVER()::int AS total FROM (
    SELECT id,actor_user_id,action,reason,metadata,created_at FROM moderation_actions WHERE target_type='organizer' AND target_id=$1
    UNION ALL SELECT id,actor_user_id,action,NULL::text AS reason,metadata,created_at FROM operation_logs WHERE resource_type='organizer' AND resource_id=$1
    ) history ORDER BY created_at DESC,id`,
        [params.organizerId],
        pagination(query.page, query.perPage),
      );
    },
    { params: organizerParams, query: t.Object(pageFields) },
  )
  .get(
    "/registrations",
    async ({ headers, query }) => {
      await requireAdmin(headers.authorization);
      if (query.from) assertDateRange(query.from, query.from);
      if (query.to) assertDateRange(query.to, query.to);
      if (query.from && query.to) assertDateRange(query.from, query.to);
      const values: unknown[] = [],
        clauses: string[] = [];
      const add = (condition: string, value: unknown) => {
        values.push(value);
        clauses.push(condition.replace("?", `$${values.length}`));
      };
      if (query.eventId) add("r.event_id=?::uuid", query.eventId);
      if (query.organizerId) add("e.organizer_id=?::uuid", query.organizerId);
      if (query.status) add("r.status=?", query.status);
      if (query.keyword)
        add(
          "(u.display_name||' '||coalesce(u.full_name,'')||' '||u.email||' '||r.id::text) ILIKE ?",
          `%${escapeLike(query.keyword)}%`,
        );
      if (query.from)
        add(
          "r.applied_at>=(?::date::timestamp AT TIME ZONE 'Asia/Tokyo')",
          query.from,
        );
      if (query.to)
        add(
          "r.applied_at<((?::date+interval '1 day') AT TIME ZONE 'Asia/Tokyo')",
          query.to,
        );
      return queryPage(
        `${registrationSelect},count(*) OVER()::int AS total FROM registrations r JOIN users u ON u.id=r.user_id JOIN events e ON e.id=r.event_id
    ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY r.applied_at DESC,r.id`,
        values,
        pagination(query.page, query.perPage),
      );
    },
    {
      query: t.Object({
        ...pageFields,
        eventId: t.Optional(t.String({ pattern: UUID_PATTERN })),
        organizerId: t.Optional(t.String({ pattern: UUID_PATTERN })),
        status: t.Optional(registrationStatus),
        keyword: t.Optional(t.String({ maxLength: 200 })),
        from: t.Optional(t.String({ format: "date" })),
        to: t.Optional(t.String({ format: "date" })),
      }),
    },
  )
  .get(
    "/registrations/:registrationId",
    async ({ headers, params }) => {
      await requireAdmin(headers.authorization);
      const [row] = await sqlClient.unsafe(
        `${registrationSelect} FROM registrations r JOIN users u ON u.id=r.user_id JOIN events e ON e.id=r.event_id WHERE r.id=$1`,
        [params.registrationId],
      );
      if (!row) throw notFound("申込が見つかりません");
      return { data: row };
    },
    { params: registrationParams },
  )
  .get(
    "/registrations/:registrationId/history",
    async ({ headers, params, query }) => {
      await requireAdmin(headers.authorization);
      await ensureTarget("registration", params.registrationId);
      return queryPage(
        `SELECT id,registration_id AS "registrationId",from_status AS "fromStatus",to_status AS "toStatus",changed_by_user_id AS "actorUserId",reason,created_at AS "createdAt",count(*) OVER()::int AS total
   FROM registration_status_histories WHERE registration_id=$1 ORDER BY created_at DESC,id`,
        [params.registrationId],
        pagination(query.page, query.perPage),
      );
    },
    { params: registrationParams, query: t.Object(pageFields) },
  )
  .get(
    "/events/:eventId/history",
    async ({ headers, params, query }) => {
      await requireAdmin(headers.authorization);
      await ensureTarget("event", params.eventId);
      return queryPage(
        `SELECT id,event_id AS "eventId",changed_by_user_id AS "actorUserId",change_type AS "changeType",before_data AS "beforeData",after_data AS "afterData",created_at AS "createdAt",count(*) OVER()::int AS total
   FROM event_change_logs WHERE event_id=$1 ORDER BY created_at DESC,id`,
        [params.eventId],
        pagination(query.page, query.perPage),
      );
    },
    {
      params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }),
      query: t.Object(pageFields),
    },
  )
  .post(
    "/reviews",
    async ({ headers, body, set }) => {
      const actor = await requireAdmin(headers.authorization);
      await ensureTarget(body.targetType, body.targetId);
      const [row] =
        await sqlClient`INSERT INTO moderation_actions(actor_user_id,target_type,target_id,action,reason)
   VALUES(${actor.id},${body.targetType},${body.targetId},'reviewed',${body.reason ?? null}) RETURNING id,target_type AS "targetType",target_id AS "targetId",created_at AS "reviewedAt"`;
      set.status = 201;
      return { data: row };
    },
    {
      body: t.Object({
        targetType,
        targetId: t.String({ pattern: UUID_PATTERN }),
        reason: t.Optional(t.String({ maxLength: 1000 })),
      }),
    },
  )
  .get(
    "/moderation-actions",
    async ({ headers, query }) => {
      await requireAdmin(headers.authorization);
      const values: unknown[] = [],
        clauses: string[] = [];
      if (query.targetType) {
        values.push(query.targetType);
        clauses.push(`target_type=$${values.length}`);
      }
      if (query.targetId) {
        values.push(query.targetId);
        clauses.push(`target_id=$${values.length}::uuid`);
      }
      return queryPage(
        `SELECT id,actor_user_id AS "actorUserId",target_type AS "targetType",target_id AS "targetId",action,reason,metadata,created_at AS "createdAt",count(*) OVER()::int AS total
   FROM moderation_actions ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY created_at DESC,id`,
        values,
        pagination(query.page, query.perPage),
      );
    },
    {
      query: t.Object({
        ...pageFields,
        targetType: t.Optional(targetType),
        targetId: t.Optional(t.String({ pattern: UUID_PATTERN })),
      }),
    },
  );

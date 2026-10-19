import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser, requireRole } from "../lib/auth";
import { ApiError, notFound } from "../lib/errors";
import { pagination, UUID_PATTERN } from "../lib/validation";
import { EVENT_SELECT_SQL, getEventById } from "../services/events";
import { notifyPublishedEvent, notifyRegistration } from "../services/notifications";

const eventStatuses = ["draft", "published", "cancelled", "completed"] as const;

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .get("/events", async ({ headers, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    const { page, perPage, offset } = pagination(query.page, query.perPage);
    const rows = await sqlClient.unsafe(`${EVENT_SELECT_SQL},NULL::text AS "registrationStatus",count(*) OVER()::int AS total
      FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
      ${query.status ? "WHERE e.status=$1" : ""} ORDER BY e.created_at DESC
      LIMIT $${query.status ? 2 : 1} OFFSET $${query.status ? 3 : 2}`,
      query.status ? [query.status, perPage, offset] : [perPage, offset]);
    const total = Number(rows[0]?.total ?? 0);
    return { data: rows.map((value: unknown) => { const { total: _total, ...row } = value as Record<string, unknown>; return row; }), pagination: { page, perPage, total } };
  }, { query: t.Object({ status: t.Optional(t.Union(eventStatuses.map((status) => t.Literal(status)))), page: t.Optional(t.Numeric()), perPage: t.Optional(t.Numeric()) }) })
  .patch("/events/:eventId/status", async ({ headers, params, body }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    const result = await sqlClient.begin(async (tx) => {
      const [current] = await tx`SELECT * FROM events WHERE id=${params.eventId} FOR UPDATE`;
      if (!current) throw notFound("イベントが見つかりません");
      if (body.status === "published" && current.status === "cancelled") {
        throw new ApiError(422, "BUSINESS_RULE_ERROR", "中止済みイベントは再公開できません");
      }
      await tx`UPDATE events SET status=${body.status},published_at=CASE WHEN ${body.status}='published' THEN COALESCE(published_at,now()) ELSE published_at END,
        updated_at=now(),version=version+1 WHERE id=${params.eventId}`;
      await tx`INSERT INTO moderation_actions (actor_user_id,target_type,target_id,action,reason,metadata)
        VALUES (${user.id},'event',${params.eventId},${body.status},${body.reason ?? null},${JSON.stringify({ fromStatus: current.status })}::jsonb)`;
      await tx`INSERT INTO event_change_logs (event_id,changed_by_user_id,change_type,before_data,after_data)
        VALUES (${params.eventId},${user.id},'status_changed',${JSON.stringify({ status: current.status })}::jsonb,${JSON.stringify({ status: body.status, reason: body.reason })}::jsonb)`;
      if (body.status === "published" && current.status !== "published") await notifyPublishedEvent(tx, params.eventId);
      if (body.status === "cancelled" && current.status !== "cancelled") {
        const registrations = await tx`SELECT user_id FROM registrations WHERE event_id=${params.eventId} AND status<>'cancelled'`;
        for (const registration of registrations) await notifyRegistration(tx, {
          userId: String(registration.user_id), eventId: params.eventId,
          title: "イベントが中止されました", message: String(current.title),
        });
      }
    });
    void result;
    return { data: await getEventById(params.eventId, user, true) };
  }, { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }), body: t.Object({
    status: t.Union(eventStatuses.map((status) => t.Literal(status))), reason: t.Optional(t.String({ maxLength: 1000 })),
  }) })
  .get("/analytics/monthly-events", async ({ headers, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    if (new Date(query.from) > new Date(query.to)) throw new ApiError(400, "VALIDATION_ERROR", "集計期間が不正です");
    const rows = await sqlClient`SELECT to_char(date_trunc('month',start_at AT TIME ZONE 'Asia/Tokyo'),'YYYY-MM') AS month,
      count(*)::int AS "eventCount" FROM events WHERE start_at>=${query.from}::date AND start_at<(${query.to}::date+interval '1 day')
      GROUP BY date_trunc('month',start_at AT TIME ZONE 'Asia/Tokyo') ORDER BY month`;
    return { data: rows };
  }, { query: t.Object({ from: t.String({ format: "date" }), to: t.String({ format: "date" }) }) })
  .get("/analytics/popular-categories", async ({ headers, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    if (new Date(query.from) > new Date(query.to)) throw new ApiError(400, "VALIDATION_ERROR", "集計期間が不正です");
    const metricOrder = {
      events: '"eventCount"', registrations: '"registrationCount"', attendance: '"attendedCount"',
    }[query.metric ?? "registrations"];
    const limit = Number(query.limit ?? 10);
    const rows = await sqlClient.unsafe(`SELECT c.id AS "categoryId",c.name AS "categoryName",
      count(DISTINCT e.id)::int AS "eventCount",
      count(r.id) FILTER(WHERE r.status<>'cancelled')::int AS "registrationCount",
      count(r.id) FILTER(WHERE r.status='checked_in')::int AS "attendedCount"
      FROM categories c LEFT JOIN events e ON e.category_id=c.id AND e.start_at >= $1::date AND e.start_at < ($2::date+interval '1 day')
      LEFT JOIN registrations r ON r.event_id=e.id GROUP BY c.id ORDER BY ${metricOrder} DESC,c.name LIMIT $3`, [query.from, query.to, limit]);
    return { data: rows };
  }, { query: t.Object({
    from: t.String({ format: "date" }), to: t.String({ format: "date" }),
    metric: t.Optional(t.Union([t.Literal("events"),t.Literal("registrations"),t.Literal("attendance")])),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  }) });

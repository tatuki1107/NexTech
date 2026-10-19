import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser, requireRole } from "../lib/auth";
import { assertDateRange } from "../lib/query";

const periodQuery = { from: t.String({ format: "date" }), to: t.String({ format: "date" }) };
const metricSchema = t.Union([t.Literal("events"), t.Literal("registrations"), t.Literal("attendance"), t.Literal("applicationRate")]);
const groupSchema = t.Union([t.Literal("category"), t.Literal("organizer"), t.Literal("format")]);
type Group = "category" | "organizer" | "format";
const eventMetrics = `SELECT e.id,e.category_id,e.organizer_id,e.format,e.start_at,e.capacity,
  count(r.id) FILTER(WHERE r.status<>'cancelled')::int AS registrations,
  count(r.id) FILTER(WHERE r.status IN ('pending','confirmed','checked_in','no_show'))::int AS participants,
  count(r.id) FILTER(WHERE r.status='checked_in')::int AS attendance
  FROM events e LEFT JOIN registrations r ON r.event_id=e.id
  WHERE e.status IN ('published','completed') GROUP BY e.id`;
const metrics = `count(m.id)::int AS "eventCount",COALESCE(sum(m.registrations),0)::int AS "registrationCount",
  COALESCE(sum(m.participants),0)::int AS "participantCount",COALESCE(sum(m.attendance),0)::int AS "attendedCount",
  COALESCE(sum(m.capacity),0)::int AS capacity,
  COALESCE(round(100.0*sum(m.participants)/NULLIF(sum(m.capacity),0),2),0)::float8 AS "applicationRate"`;
const authorize = async (authorization: string | undefined, from: string, to: string): Promise<void> => {
  requireRole((await getCurrentUser(authorization))!, "admin");
  assertDateRange(from, to);
};
const ranking = async (group: Group, from: string, to: string, metric = "registrations", limit = 10) => {
  const dimension = {
    category: { select: `d.id AS "categoryId",d.name AS "categoryName"`, from: "categories d", join: "m.category_id=d.id", by: "d.id,d.name" },
    organizer: { select: `d.id AS "organizerId",d.name AS "organizerName"`, from: "organizers d", join: "m.organizer_id=d.id", by: "d.id,d.name" },
    format: { select: `d.name AS format`, from: "(VALUES ('online'),('offline'),('hybrid')) d(name)", join: "m.format=d.name", by: "d.name" },
  }[group];
  const order = { events: '"eventCount"', registrations: '"registrationCount"', attendance: '"attendedCount"', applicationRate: '"applicationRate"' }[metric as "events" | "registrations" | "attendance" | "applicationRate"];
  return sqlClient.unsafe(`WITH event_metrics AS (${eventMetrics}) SELECT ${dimension.select},${metrics}
    FROM ${dimension.from} LEFT JOIN event_metrics m ON ${dimension.join}
      AND m.start_at >= ($1::date)::timestamp AT TIME ZONE 'Asia/Tokyo'
      AND m.start_at < ($2::date+1)::timestamp AT TIME ZONE 'Asia/Tokyo'
    GROUP BY ${dimension.by} ORDER BY ${order} DESC,d.name LIMIT $3`, [from, to, limit]);
};

export const analyticsRoutes = new Elysia({ prefix: "/admin/analytics" })
  .get("/monthly-events", async ({ headers, query }) => {
    await authorize(headers.authorization, query.from, query.to);
    const data = await sqlClient.unsafe(`WITH event_metrics AS (${eventMetrics}), months AS (
      SELECT generate_series(date_trunc('month',$1::date),date_trunc('month',$2::date),interval '1 month')::date AS month)
      SELECT to_char(months.month,'YYYY-MM') AS month,${metrics} FROM months
      LEFT JOIN event_metrics m ON date_trunc('month',m.start_at AT TIME ZONE 'Asia/Tokyo')=months.month
        AND m.start_at >= ($1::date)::timestamp AT TIME ZONE 'Asia/Tokyo'
        AND m.start_at < ($2::date+1)::timestamp AT TIME ZONE 'Asia/Tokyo'
      GROUP BY months.month ORDER BY months.month`, [query.from, query.to]);
    return { data };
  }, { query: t.Object(periodQuery) })
  .get("/popular-categories", async ({ headers, query }) => {
    await authorize(headers.authorization, query.from, query.to);
    return { data: await ranking("category", query.from, query.to, query.metric, query.limit) };
  }, { query: t.Object({ ...periodQuery, metric: t.Optional(metricSchema), limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })) }) })
  .get("/popular-organizers", async ({ headers, query }) => {
    await authorize(headers.authorization, query.from, query.to);
    return { data: await ranking("organizer", query.from, query.to, query.metric, query.limit) };
  }, { query: t.Object({ ...periodQuery, metric: t.Optional(metricSchema), limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })) }) })
  .get("/report", async ({ headers, query }) => {
    await authorize(headers.authorization, query.from, query.to);
    const [previousPeriod] = await sqlClient`SELECT (${query.from}::date-(${query.to}::date-${query.from}::date+1))::text AS "from",(${query.from}::date-1)::text AS "to"`;
    const group = query.groupBy ?? "category";
    return { data: {
      groupBy: group, metric: query.metric ?? "registrations",
      current: { from: query.from, to: query.to, items: await ranking(group, query.from, query.to, query.metric, query.limit) },
      previous: { from: previousPeriod.from, to: previousPeriod.to, items: await ranking(group, String(previousPeriod.from), String(previousPeriod.to), query.metric, query.limit) },
    } };
  }, { query: t.Object({ ...periodQuery, groupBy: t.Optional(groupSchema), metric: t.Optional(metricSchema), limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })) }) });

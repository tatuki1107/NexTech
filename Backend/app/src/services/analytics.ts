import { sqlClient } from "../db";
import { assertDateRange } from "../lib/validation";

export type AnalyticsFilter = {
  from: string;
  to: string;
  organizerId?: string;
  categoryId?: string;
  format?: string;
};
export type AnalyticsMetric =
  | "events"
  | "registrations"
  | "attendance"
  | "applicationRate";
export type AnalyticsAxis = "category" | "organizer" | "format";
const filteredEvents = (filter: AnalyticsFilter) => {
  assertDateRange(filter.from, filter.to);
  const values: unknown[] = [filter.from, filter.to];
  const conditions = [
    "e.status IN ('published','completed')",
    "e.start_at>=($1::date::timestamp AT TIME ZONE 'Asia/Tokyo')",
    "e.start_at<(($2::date+interval '1 day') AT TIME ZONE 'Asia/Tokyo')",
  ];
  if (filter.organizerId) {
    values.push(filter.organizerId);
    conditions.push(`e.organizer_id=$${values.length}::uuid`);
  }
  if (filter.categoryId) {
    values.push(filter.categoryId);
    conditions.push(`e.category_id=$${values.length}::uuid`);
  }
  if (filter.format) {
    values.push(filter.format);
    conditions.push(`e.format=$${values.length}`);
  }
  return {
    values,
    sql: `SELECT e.* FROM events e WHERE ${conditions.join(" AND ")}`,
  };
};

export const monthlyAnalytics = async (
  filter: AnalyticsFilter,
): Promise<Record<string, unknown>[]> => {
  const scope = filteredEvents(filter);
  return sqlClient.unsafe(
    `WITH scoped AS (${scope.sql}), months AS (
   SELECT generate_series(date_trunc('month',$1::date::timestamp),date_trunc('month',$2::date::timestamp),interval '1 month') AS month)
  SELECT to_char(months.month,'YYYY-MM') AS month,count(DISTINCT e.id)::int AS "eventCount",
   count(r.id) FILTER(WHERE r.status<>'cancelled')::int AS "registrationCount",
   count(DISTINCT r.user_id) FILTER(WHERE r.status IN ('confirmed','checked_in'))::int AS "participantCount",
   count(r.id) FILTER(WHERE r.status IN ('pending','confirmed','checked_in','no_show'))::int AS "confirmedCount",
   count(r.id) FILTER(WHERE r.status='checked_in')::int AS "attendedCount"
  FROM months LEFT JOIN scoped e ON date_trunc('month',e.start_at AT TIME ZONE 'Asia/Tokyo')=months.month
   LEFT JOIN registrations r ON r.event_id=e.id GROUP BY months.month ORDER BY months.month`,
    scope.values,
  );
};

export const groupedAnalytics = async (
  filter: AnalyticsFilter,
  axis: AnalyticsAxis,
  metric: AnalyticsMetric,
  limit: number,
): Promise<Record<string, unknown>[]> => {
  const scope = filteredEvents(filter);
  const group = {
    category: {
      id: "c.id::text",
      name: "c.name",
      join: "JOIN categories c ON c.id=e.category_id",
    },
    organizer: {
      id: "o.id::text",
      name: "o.name",
      join: "JOIN organizers o ON o.id=e.organizer_id",
    },
    format: { id: "e.format", name: "e.format", join: "" },
  }[axis];
  const order = {
    events: '"eventCount"',
    registrations: '"registrationCount"',
    attendance: '"attendedCount"',
    applicationRate: '"applicationRate"',
  }[metric];
  const rows = await sqlClient.unsafe(
    `WITH scoped AS (${scope.sql}), event_metrics AS (
  SELECT e.id,e.organizer_id,e.category_id,e.format,e.capacity,
   count(r.id) FILTER(WHERE r.status<>'cancelled')::int AS registrations,
   count(r.id) FILTER(WHERE r.status IN ('pending','confirmed','checked_in','no_show'))::int AS confirmed,
   count(r.id) FILTER(WHERE r.status='checked_in')::int AS attended
  FROM scoped e LEFT JOIN registrations r ON r.event_id=e.id GROUP BY e.id,e.organizer_id,e.category_id,e.format,e.capacity)
 SELECT ${group.id} AS "groupId",${group.name} AS "groupName",count(*)::int AS "eventCount",
  sum(e.registrations)::int AS "registrationCount",sum(e.confirmed)::int AS "confirmedCount",
  sum(e.attended)::int AS "attendedCount",sum(e.capacity)::int AS capacity,
  (sum(e.registrations)::float8/NULLIF(sum(e.capacity),0)) AS "applicationRate"
 FROM event_metrics e ${group.join} GROUP BY ${group.id},${group.name}
 ORDER BY ${order} DESC,"groupName","groupId" LIMIT $${scope.values.length + 1}`,
    [...scope.values, limit],
  );
  return rows.map((row: Record<string, unknown>) => ({
    ...row,
    ...(axis === "category"
      ? { categoryId: row.groupId, categoryName: row.groupName }
      : axis === "organizer"
        ? { organizerId: row.groupId, organizerName: row.groupName }
        : { format: row.groupId }),
  }));
};

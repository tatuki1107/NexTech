import { Elysia, t } from "elysia";
import { asc, eq } from "drizzle-orm";
import { db, sqlClient } from "../db";
import { categories } from "../db/schema";
import { getCurrentUser } from "../lib/auth";
import { pagination, UUID_PATTERN } from "../lib/validation";
import { EVENT_SELECT_SQL, getEventById } from "../services/events";
import { ApiError, notFound } from "../lib/errors";

export const publicRoutes = new Elysia()
  .get("/categories", async () => ({ data: await db.select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories).where(eq(categories.status, "active")).orderBy(asc(categories.displayOrder), asc(categories.name)) }))
  .get("/tags", async ({ query }) => ({ data: await sqlClient`
    SELECT id,name,slug FROM tags WHERE ${query.keyword ?? ""}='' OR name ILIKE ${`%${query.keyword ?? ""}%`} ORDER BY name LIMIT 50` }), {
      query: t.Object({ keyword: t.Optional(t.String({ maxLength: 80 })) }),
    })
  .get("/events", async ({ query, headers }) => {
    const user = await getCurrentUser(headers.authorization, true);
    const { page, perPage, offset } = pagination(query.page, query.perPage);
    const clauses = ["e.status='published'", "e.visibility='public'", "o.status='active'"];
    const values: unknown[] = [user?.id ?? null];
    const add = (clause: string, value: string | number | boolean) => { values.push(value); clauses.push(clause.replace("?", `$${values.length}`)); };
    if (query.keyword) add("(e.title||' '||coalesce(e.summary,'')||' '||e.description) ILIKE ?", `%${query.keyword}%`);
    if (query.startDate) add("e.start_at >= (?::date)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.startDate);
    if (query.endDate) add("e.start_at < (?::date+1)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.endDate);
    if (query.categoryId) add("e.category_id=?::uuid", query.categoryId);
    if (query.organizerId) add("e.organizer_id=?::uuid", query.organizerId);
    if (query.organizerName) add("o.name ILIKE ?", `%${query.organizerName}%`);
    if (query.startDate && query.endDate && query.startDate > query.endDate) throw new ApiError(400, "VALIDATION_ERROR", "検索期間が不正です");
    if (query.format) add("e.format=?", query.format);
    if (query.hasCapacity !== undefined) {
      const comparison = query.hasCapacity ? "<" : ">=";
      clauses.push(`(SELECT count(*) FROM registrations r WHERE r.event_id=e.id AND r.status IN ('pending','confirmed','checked_in','no_show')) ${comparison} e.capacity`);
    }
    if (query.tagIds) {
      const tagIds = query.tagIds.split(",").filter(Boolean);
      values.push(`{${tagIds.join(",")}}`); clauses.push(`EXISTS (SELECT 1 FROM event_tags f WHERE f.event_id=e.id AND f.tag_id=ANY($${values.length}::uuid[]))`);
    }
    const [count] = await sqlClient.unsafe(`WITH viewer AS (SELECT $1::uuid AS id) SELECT count(*)::int AS total FROM events e JOIN organizers o ON o.id=e.organizer_id WHERE ${clauses.join(" AND ")}`, values);
    values.push(perPage, offset);
    const rows = await sqlClient.unsafe(`${EVENT_SELECT_SQL},
      (SELECT status FROM registrations r WHERE r.event_id=e.id AND r.user_id=$1 AND r.status<>'cancelled' LIMIT 1) AS "registrationStatus",
      count(*) OVER()::int AS total
      FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
      WHERE ${clauses.join(" AND ")} ORDER BY e.start_at ASC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    const total = Number(count.total);
    return { data: rows.map((value: unknown) => {
      const row = value as Record<string, unknown>;
      const { total: _total, description: _description, onlineUrl: _onlineUrl, status: _status, ...item } = row;
      return item;
    }), pagination: { page, perPage, total } };
  }, { query: t.Object({
    organizerName: t.Optional(t.String({ maxLength: 100 })),
    keyword: t.Optional(t.String({ maxLength: 200 })), startDate: t.Optional(t.String({ format: "date" })), endDate: t.Optional(t.String({ format: "date" })),
    categoryId: t.Optional(t.String({ pattern: UUID_PATTERN })), tagIds: t.Optional(t.String({ pattern: `^${UUID_PATTERN.slice(1, -1)}(?:,${UUID_PATTERN.slice(1, -1)})*$` })), organizerId: t.Optional(t.String({ pattern: UUID_PATTERN })),
    format: t.Optional(t.Union([t.Literal("online"),t.Literal("offline"),t.Literal("hybrid")])), hasCapacity: t.Optional(t.Boolean()),
    page: t.Optional(t.Numeric()), perPage: t.Optional(t.Numeric()),
  }) })
  .get("/events/:eventId", async ({ params, headers }) => ({ data: await getEventById(params.eventId, await getCurrentUser(headers.authorization, true)) }), {
    params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }),
  })
  .get("/organizers/:organizerId", async ({ params }) => {
    const rows = await sqlClient`SELECT id,name,slug,description,website_url AS "websiteUrl",contact_email AS "contactEmail",status
      FROM organizers WHERE id=${params.organizerId} AND status='active'`;
    if (!rows[0]) throw notFound("主催者が見つかりません");
    return { data: rows[0] };
  }, { params: t.Object({ organizerId: t.String({ pattern: UUID_PATTERN }) }) });

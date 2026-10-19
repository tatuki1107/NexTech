import { Elysia, t } from "elysia";
import { getCurrentUser, requireRole } from "../lib/auth";
import { assertDateRange, listQuery, listSql } from "../lib/query";
import { UUID_PATTERN } from "../lib/validation";
import { EVENT_SELECT_SQL, getEventById } from "../services/events";
import { changeEventStatus, eventStatusSchema } from "../services/event-status";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .get("/events", async ({ headers, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    assertDateRange(query.from, query.to);
    const values: unknown[] = [];
    const clauses = ["true"];
    const add = (clause: string, value: unknown) => { values.push(value); clauses.push(clause.replaceAll("?", `$${values.length}`)); };
    if (query.status) add("e.status=?", query.status);
    if (query.keyword) add("(e.title ILIKE ? OR o.name ILIKE ?)", `%${query.keyword}%`);
    if (query.from) add("e.start_at >= (?::date)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.from);
    if (query.to) add("e.start_at < (?::date+1)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.to);
    return listSql(`${EVENT_SELECT_SQL},NULL::text AS "registrationStatus"`, `FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id WHERE ${clauses.join(" AND ")}`, values, query, "e.created_at DESC,e.id");
  }, { query: t.Object({ ...listQuery, status: t.Optional(eventStatusSchema) }) })
  .patch("/events/:eventId/status", async ({ headers, params, body }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    await changeEventStatus(params.eventId, user, body.status, body.reason, true);
    return { data: await getEventById(params.eventId, user, true) };
  }, { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }), body: t.Object({ status: eventStatusSchema, reason: t.String({ minLength: 1, maxLength: 1000 }) }) });

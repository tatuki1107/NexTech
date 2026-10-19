import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser, requireRole } from "../lib/auth";
import { notFound } from "../lib/errors";
import { assertDateRange, listQuery, listSql } from "../lib/query";
import { UUID_PATTERN } from "../lib/validation";
import { getEventById } from "../services/events";
import { requireEventAccess } from "../services/access";

const uuid = t.String({ pattern: UUID_PATTERN });
const organizerStatus = t.Union([t.Literal("active"), t.Literal("inactive"), t.Literal("suspended")]);
const registrationStatus = t.Union([t.Literal("pending"), t.Literal("confirmed"), t.Literal("waitlisted"), t.Literal("cancelled"), t.Literal("checked_in"), t.Literal("no_show")]);
const organizerSelect = `SELECT o.id,o.name,o.slug,o.description,o.website_url AS "websiteUrl",o.contact_email AS "contactEmail",o.status,o.owner_user_id AS "ownerUserId",o.created_at AS "createdAt"`;
const registrationSelect = `SELECT r.id,r.event_id AS "eventId",r.user_id AS "userId",r.status,r.waitlist_position AS "waitlistPosition",r.applied_at AS "appliedAt",r.checked_in_at AS "checkedInAt",jsonb_build_object('id',u.id,'displayName',u.display_name,'fullName',u.full_name,'email',u.email) AS user,jsonb_build_object('id',e.id,'title',e.title) AS event`;

export const managementRoutes = new Elysia()
  .get("/admin/organizers", async ({ headers, query }) => {
    requireRole((await getCurrentUser(headers.authorization))!, "admin");
    assertDateRange(query.from, query.to);
    const values: unknown[] = [];
    const clauses = ["true"];
    const add = (clause: string, value: unknown) => { values.push(value); clauses.push(clause.replaceAll("?", `$${values.length}`)); };
    if (query.status) add("o.status=?", query.status);
    if (query.keyword) add("(o.name ILIKE ? OR o.slug ILIKE ?)", `%${query.keyword}%`);
    if (query.from) add("o.created_at >= (?::date)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.from);
    if (query.to) add("o.created_at < (?::date+1)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.to);
    return listSql(organizerSelect, `FROM organizers o WHERE ${clauses.join(" AND ")}`, values, query, "o.created_at DESC,o.id");
  }, { query: t.Object({ ...listQuery, status: t.Optional(organizerStatus) }) })
  .get("/admin/organizers/:organizerId", async ({ headers, params }) => {
    requireRole((await getCurrentUser(headers.authorization))!, "admin");
    const [organizer] = await sqlClient.unsafe(`${organizerSelect} FROM organizers o WHERE o.id=$1`, [params.organizerId]);
    if (!organizer) throw notFound();
    return { data: organizer };
  }, { params: t.Object({ organizerId: uuid }) })
  .patch("/admin/organizers/:organizerId/status", async ({ headers, params, body }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    const organizer = await sqlClient.begin(async (tx) => {
      const [current] = await tx`SELECT status FROM organizers WHERE id=${params.organizerId} FOR UPDATE`;
      if (!current) throw notFound();
      const [updated] = await tx`UPDATE organizers SET status=${body.status},updated_at=now() WHERE id=${params.organizerId} RETURNING id,name,slug,status`;
      await tx`INSERT INTO moderation_actions (actor_user_id,target_type,target_id,action,reason,metadata) VALUES (${user.id},'organizer',${params.organizerId},${body.status},${body.reason},${{ fromStatus: current.status }}::jsonb)`;
      await tx`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id) VALUES (${user.id},'organizer.status','organizer',${params.organizerId})`;
      return updated;
    });
    return { data: organizer };
  }, { params: t.Object({ organizerId: uuid }), body: t.Object({ status: organizerStatus, reason: t.String({ minLength: 1, maxLength: 1000 }) }) })
  .get("/admin/registrations", async ({ headers, query }) => {
    requireRole((await getCurrentUser(headers.authorization))!, "admin");
    assertDateRange(query.from, query.to);
    const values: unknown[] = [];
    const clauses = ["true"];
    const add = (clause: string, value: unknown) => { values.push(value); clauses.push(clause.replaceAll("?", `$${values.length}`)); };
    if (query.status) add("r.status=?", query.status);
    if (query.eventId) add("r.event_id=?::uuid", query.eventId);
    if (query.keyword) add("(u.display_name ILIKE ? OR u.full_name ILIKE ? OR u.email ILIKE ? OR r.id::text ILIKE ? OR e.title ILIKE ?)", `%${query.keyword}%`);
    if (query.from) add("r.applied_at >= (?::date)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.from);
    if (query.to) add("r.applied_at < (?::date+1)::timestamp AT TIME ZONE 'Asia/Tokyo'", query.to);
    return listSql(registrationSelect, `FROM registrations r JOIN users u ON u.id=r.user_id JOIN events e ON e.id=r.event_id WHERE ${clauses.join(" AND ")}`, values, query, "r.applied_at DESC,r.id");
  }, { query: t.Object({ ...listQuery, status: t.Optional(registrationStatus), eventId: t.Optional(uuid) }) })
  .get("/admin/registrations/:registrationId", async ({ headers, params }) => {
    requireRole((await getCurrentUser(headers.authorization))!, "admin");
    const [registration] = await sqlClient.unsafe(`${registrationSelect} FROM registrations r JOIN users u ON u.id=r.user_id JOIN events e ON e.id=r.event_id WHERE r.id=$1`, [params.registrationId]);
    if (!registration) throw notFound();
    const history = await sqlClient`SELECT id,from_status AS "fromStatus",to_status AS "toStatus",changed_by_user_id AS "changedByUserId",reason,created_at AS "createdAt" FROM registration_status_histories WHERE registration_id=${params.registrationId} ORDER BY created_at,id`;
    return { data: { ...registration, history } };
  }, { params: t.Object({ registrationId: uuid }) })
  .get("/admin/events/:eventId", async ({ headers, params }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    return { data: await getEventById(params.eventId, user, true) };
  }, { params: t.Object({ eventId: uuid }) })
  .post("/admin/reviews", async ({ headers, body, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    requireRole(user, "admin");
    const table = { event: "events", organizer: "organizers", registration: "registrations" }[body.targetType];
    await sqlClient.begin(async (tx) => {
      if (!(await tx.unsafe(`SELECT id FROM ${table} WHERE id=$1 FOR UPDATE`, [body.targetId])).length) throw notFound();
      await tx`INSERT INTO moderation_actions (actor_user_id,target_type,target_id,action,reason) VALUES (${user.id},${body.targetType},${body.targetId},'reviewed',${body.reason ?? null})`;
      await tx`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id) VALUES (${user.id},'moderation.review',${body.targetType},${body.targetId})`;
    });
    set.status = 204;
  }, { body: t.Object({ targetType: t.Union([t.Literal("event"), t.Literal("organizer"), t.Literal("registration")]), targetId: uuid, reason: t.Optional(t.String({ maxLength: 1000 })) }) })
  .get("/admin/moderation-actions", async ({ headers, query }) => {
    requireRole((await getCurrentUser(headers.authorization))!, "admin");
    return listSql(`SELECT id,actor_user_id AS "actorUserId",target_type AS "targetType",target_id AS "targetId",action,reason,metadata,created_at AS "createdAt"`, "FROM moderation_actions WHERE target_type=$1 AND target_id=$2", [query.targetType, query.targetId], query, "created_at DESC,id");
  }, { query: t.Object({ page: listQuery.page, perPage: listQuery.perPage, targetType: t.Union([t.Literal("event"), t.Literal("organizer"), t.Literal("registration")]), targetId: uuid }) })
  .get("/events/:eventId/history", async ({ headers, params, query }) => {
    await requireEventAccess((await getCurrentUser(headers.authorization))!, params.eventId);
    return listSql(`SELECT id,changed_by_user_id AS "changedByUserId",change_type AS "changeType",before_data AS "beforeData",after_data AS "afterData",created_at AS "createdAt"`, "FROM event_change_logs WHERE event_id=$1", [params.eventId], query, "created_at DESC,id");
  }, { params: t.Object({ eventId: uuid }), query: t.Object({ page: listQuery.page, perPage: listQuery.perPage }) });

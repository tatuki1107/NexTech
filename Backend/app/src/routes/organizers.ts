import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser } from "../lib/auth";
import { ApiError, notFound } from "../lib/errors";
import { pagination, SLUG_PATTERN, UUID_PATTERN, assertEventTimes } from "../lib/validation";
import { requireEventAccess, requireOrganizerAccess } from "../services/access";
import { EVENT_SELECT_SQL, getEventById } from "../services/events";
import { queryPage } from "../db/pagination";

const eventFields = {
  title: t.String({ minLength: 1, maxLength: 160 }), summary: t.Optional(t.String({ maxLength: 300 })),
  description: t.String({ minLength: 1 }), categoryId: t.String({ pattern: UUID_PATTERN }),
  tagIds: t.Optional(t.Array(t.String({ pattern: UUID_PATTERN }), { maxItems: 30 })),
  format: t.Union([t.Literal("online"),t.Literal("offline"),t.Literal("hybrid")]),
  venueName: t.Optional(t.String({ maxLength: 160 })), address: t.Optional(t.String({ maxLength: 1000 })),
  onlineUrl: t.Optional(t.String({ format: "uri", maxLength: 2000 })), startAt: t.String({ format: "date-time" }),
  endAt: t.String({ format: "date-time" }), capacity: t.Integer({ minimum: 1 }), waitlistEnabled: t.Boolean(),
  applicationStartAt: t.Optional(t.String({ format: "date-time" })), applicationDeadline: t.String({ format: "date-time" }),
};
export const organizerRoutes = new Elysia()
  .post("/organizers", async ({ headers, body, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    const result = await sqlClient.begin(async (tx) => {
      if ((await tx`SELECT 1 FROM organizers WHERE slug=${body.slug}`).length) throw new ApiError(409, "CONFLICT", "このslugは既に使われています");
      const [organizer] = await tx`INSERT INTO organizers (owner_user_id,name,slug,description,website_url,contact_email)
        VALUES (${user.id},${body.name},${body.slug},${body.description ?? null},${body.websiteUrl ?? null},${body.contactEmail ?? null})
        RETURNING id,name,slug,description,website_url AS "websiteUrl",contact_email AS "contactEmail",status`;
      await tx`INSERT INTO organizer_members (organizer_id,user_id,member_role) VALUES (${organizer.id},${user.id},'owner')`;
      await tx`INSERT INTO user_roles (user_id,role_code) VALUES (${user.id},'organizer') ON CONFLICT DO NOTHING`;
      return organizer;
    });
    set.status = 201;
    return { data: result };
  }, { body: t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }), slug: t.String({ pattern: SLUG_PATTERN, maxLength: 100 }),
    description: t.Optional(t.String({ maxLength: 3000 })), websiteUrl: t.Optional(t.String({ format: "uri" })),
    contactEmail: t.Optional(t.String({ format: "email" })),
  }) })
  .patch("/organizers/:organizerId", async ({ headers, params, body }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await requireOrganizerAccess(user, params.organizerId);
    if (body.slug && (await sqlClient`SELECT 1 FROM organizers WHERE slug=${body.slug} AND id<>${params.organizerId}`).length) {
      throw new ApiError(409, "CONFLICT", "このslugは既に使われています");
    }
    const [updated] = await sqlClient`UPDATE organizers SET
      name=COALESCE(${body.name ?? null},name),slug=COALESCE(${body.slug ?? null},slug),
      description=CASE WHEN ${body.description !== undefined} THEN ${body.description ?? null} ELSE description END,
      website_url=CASE WHEN ${body.websiteUrl !== undefined} THEN ${body.websiteUrl ?? null} ELSE website_url END,
      contact_email=CASE WHEN ${body.contactEmail !== undefined} THEN ${body.contactEmail ?? null} ELSE contact_email END,
      updated_at=now() WHERE id=${params.organizerId}
      RETURNING id,name,slug,description,website_url AS "websiteUrl",contact_email AS "contactEmail",status`;
    return { data: updated };
  }, { params: t.Object({ organizerId: t.String({ pattern: UUID_PATTERN }) }), body: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 100 })), slug: t.Optional(t.String({ pattern: SLUG_PATTERN, maxLength: 100 })),
    description: t.Optional(t.Nullable(t.String({ maxLength: 3000 }))), websiteUrl: t.Optional(t.Nullable(t.String({ format: "uri" }))),
    contactEmail: t.Optional(t.Nullable(t.String({ format: "email" }))),
  }) })
  .get("/organizers/:organizerId/events", async ({ headers, params, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await requireOrganizerAccess(user, params.organizerId);
    const page = pagination(query.page, query.perPage);
    return queryPage(`${EVENT_SELECT_SQL},NULL::text AS "registrationStatus",count(*) OVER()::int AS total
      FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
      WHERE e.organizer_id=$1 ${query.status ? "AND e.status=$2" : ""} ORDER BY e.start_at DESC,e.id`,
      query.status ? [params.organizerId, query.status] : [params.organizerId], page);
  }, { params: t.Object({ organizerId: t.String({ pattern: UUID_PATTERN }) }), query: t.Object({
    status: t.Optional(t.Union([t.Literal("draft"),t.Literal("published"),t.Literal("cancelled"),t.Literal("completed")])),
    page: t.Optional(t.Numeric()), perPage: t.Optional(t.Numeric()),
  }) })
  .post("/organizers/:organizerId/events", async ({ headers, params, body, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await requireOrganizerAccess(user, params.organizerId);
    assertEventTimes(body.startAt, body.endAt, body.applicationDeadline);
    const eventId = await sqlClient.begin(async (tx) => {
      const [event] = await tx`INSERT INTO events
        (organizer_id,category_id,created_by,title,summary,description,format,venue_name,address,online_url,
         timezone,start_at,end_at,capacity,waitlist_enabled,application_start_at,application_deadline)
        VALUES (${params.organizerId},${body.categoryId},${user.id},${body.title},${body.summary ?? null},${body.description},
          ${body.format},${body.venueName ?? null},${body.address ?? null},${body.onlineUrl ?? null},'Asia/Tokyo',${body.startAt},${body.endAt},
          ${body.capacity},${body.waitlistEnabled},${body.applicationStartAt ?? null},${body.applicationDeadline}) RETURNING id`;
      for (const tagId of body.tagIds ?? []) await tx`INSERT INTO event_tags (event_id,tag_id) VALUES (${event.id},${tagId}) ON CONFLICT DO NOTHING`;
      await tx`INSERT INTO event_change_logs (event_id,changed_by_user_id,change_type,after_data) VALUES (${event.id},${user.id},'created',${JSON.stringify(body)}::jsonb)`;
      return event.id as string;
    });
    set.status = 201;
    return { data: await getEventById(eventId, user, true) };
  }, { params: t.Object({ organizerId: t.String({ pattern: UUID_PATTERN }) }), body: t.Object(eventFields) })
  .patch("/events/:eventId", async ({ headers, params, body }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await requireEventAccess(user, params.eventId);
    await sqlClient.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM events WHERE id=${params.eventId} FOR UPDATE`;
    if (!current) throw notFound("イベントが見つかりません");
    const mergedStart = body.startAt ?? String(current.start_at);
    const mergedEnd = body.endAt ?? String(current.end_at);
    const mergedDeadline = body.applicationDeadline ?? (current.application_deadline ? String(current.application_deadline) : null);
    assertEventTimes(mergedStart, mergedEnd, mergedDeadline);
    if (body.capacity !== undefined) {
      const [{ count }] = await tx`SELECT count(*)::int AS count FROM registrations
        WHERE event_id=${params.eventId} AND status IN ('pending','confirmed','checked_in','no_show')`;
      if (body.capacity < Number(count)) throw new ApiError(422, "BUSINESS_RULE_ERROR", "定員を参加確定数より少なくできません");
    }
    const mapping: Record<string, string> = {
      title:"title",summary:"summary",description:"description",categoryId:"category_id",format:"format",venueName:"venue_name",
      address:"address",onlineUrl:"online_url",startAt:"start_at",endAt:"end_at",capacity:"capacity",waitlistEnabled:"waitlist_enabled",
      applicationStartAt:"application_start_at",applicationDeadline:"application_deadline",
    };
    const entries = Object.entries(body).filter(([key, value]) => key in mapping && value !== undefined);
    const values: unknown[] = [];
    const sets = entries.map(([key, value]) => { values.push(value); return `${mapping[key]}=$${values.length}`; });
      values.push(params.eventId);
      await tx.unsafe(`UPDATE events SET ${sets.length ? sets.join(",") + ',' : ''}updated_at=now(),version=version+1 WHERE id=$${values.length}`, values);
    if (body.tagIds) {
      await tx`DELETE FROM event_tags WHERE event_id=${params.eventId}`;
      for (const tagId of body.tagIds ?? []) await tx`INSERT INTO event_tags(event_id,tag_id) VALUES (${params.eventId},${tagId})`;
    }
    await tx`INSERT INTO event_change_logs (event_id,changed_by_user_id,change_type,before_data,after_data)
      VALUES (${params.eventId},${user.id},'updated',${JSON.stringify(current)}::jsonb,${JSON.stringify(body)}::jsonb)`;
    });
    return { data: await getEventById(params.eventId, user, true) };
  }, { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }), body: t.Partial(t.Object(eventFields)) });

export const organizerOperationsRoutes = new Elysia({ prefix: "/events/:eventId" })
  .get("/registrations", async ({ headers, params, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await requireEventAccess(user, params.eventId);
    const page = pagination(query.page, query.perPage);
    const values: Array<string | number> = [params.eventId];
    const clauses = ["r.event_id=$1"];
    if (query.status) { values.push(query.status); clauses.push(`r.status=$${values.length}`); }
    if (query.keyword) { values.push(`%${query.keyword}%`); clauses.push(`(u.display_name ILIKE $${values.length} OR u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`); }
    return queryPage(`SELECT r.id,r.event_id AS "eventId",r.user_id AS "userId",r.status,
      r.waitlist_position AS "waitlistPosition",r.applied_at AS "appliedAt",r.confirmed_at AS "confirmedAt",
      r.cancelled_at AS "cancelledAt",r.checked_in_at AS "checkedInAt",
      jsonb_build_object('id',u.id,'email',u.email,'displayName',u.display_name,'fullName',u.full_name,'roles','[]'::jsonb,'status',u.status) AS user,
      count(*) OVER()::int AS total FROM registrations r JOIN users u ON u.id=r.user_id
      WHERE ${clauses.join(" AND ")} ORDER BY r.applied_at,r.id`, values, page);
  }, { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }), query: t.Object({
    status: t.Optional(t.Union([t.Literal("pending"),t.Literal("confirmed"),t.Literal("waitlisted"),t.Literal("cancelled"),t.Literal("checked_in"),t.Literal("no_show")])),
    keyword: t.Optional(t.String({ maxLength: 200 })), page: t.Optional(t.Numeric()), perPage: t.Optional(t.Numeric()),
  }) })
  .get("/recruitment-summary", async ({ headers, params }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await requireEventAccess(user, params.eventId);
    const [summary] = await sqlClient`SELECT e.id AS "eventId",e.capacity,
      count(r.id) FILTER(WHERE r.status IN ('pending','confirmed','checked_in','no_show'))::int AS "confirmedCount",
      count(r.id) FILTER(WHERE r.status='waitlisted')::int AS "waitlistCount",
      count(r.id) FILTER(WHERE r.status='cancelled')::int AS "cancelledCount",
      count(r.id) FILTER(WHERE r.status='checked_in')::int AS "attendedCount",
      GREATEST(e.capacity-count(r.id) FILTER(WHERE r.status IN ('pending','confirmed','checked_in','no_show')),0)::int AS "availableSeats"
      FROM events e LEFT JOIN registrations r ON r.event_id=e.id WHERE e.id=${params.eventId} GROUP BY e.id`;
    return { data: summary };
  }, { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }) })
  .post("/registrations/:registrationId/check-in", async ({ headers, params, body }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await requireEventAccess(user, params.eventId);
    const result = await sqlClient.begin(async (tx) => {
      // Match cancellation/moderation lock order: event first, then registration.
      const [event] = await tx`SELECT status,organizer_id FROM events WHERE id=${params.eventId} FOR UPDATE`;
      if (!event) throw notFound("イベントが見つかりません");
      if (event.status !== "published") throw new ApiError(422, "BUSINESS_RULE_ERROR", "公開中のイベントだけ受付できます");
      if (!(await tx`SELECT 1 FROM organizers WHERE id=${event.organizer_id} AND status='active'`).length) {
        throw new ApiError(422, "BUSINESS_RULE_ERROR", "停止中の主催者のイベントは受付できません");
      }
      const [registration] = await tx`SELECT * FROM registrations WHERE id=${params.registrationId} AND event_id=${params.eventId} FOR UPDATE`;
      if (!registration) throw notFound("申込が見つかりません");
      if (registration.status !== "confirmed") throw new ApiError(422, "BUSINESS_RULE_ERROR", "参加確定済みの申込だけ受付できます");
      const [updated] = await tx`UPDATE registrations SET status='checked_in',checked_in_at=now(),checkin_note=${body?.note ?? null},
        updated_at=now(),version=version+1 WHERE id=${params.registrationId}
        RETURNING id,event_id AS "eventId",user_id AS "userId",status,waitlist_position AS "waitlistPosition",
          applied_at AS "appliedAt",confirmed_at AS "confirmedAt",cancelled_at AS "cancelledAt",checked_in_at AS "checkedInAt"`;
      await tx`INSERT INTO registration_status_histories
        (registration_id,from_status,to_status,changed_by_user_id,reason)
        VALUES (${registration.id},'confirmed','checked_in',${user.id},'check_in')`;
      await tx`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id)
        VALUES (${user.id},'registration.check_in','registration',${registration.id})`;
      return updated;
    });
    return { data: result };
  }, { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }), registrationId: t.String({ pattern: UUID_PATTERN }) }),
    body: t.Optional(t.Object({ note: t.Optional(t.String({ maxLength: 255 })) })) });

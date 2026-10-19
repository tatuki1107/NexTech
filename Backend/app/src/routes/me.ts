import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser, toPublicUser } from "../lib/auth";
import { notFound } from "../lib/errors";
import { pagination, UUID_PATTERN } from "../lib/validation";
import { EVENT_SELECT_SQL } from "../services/events";
import { listSql } from "../lib/query";

export const meRoutes = new Elysia({ prefix: "/me" })
  .get("/related-events", async ({ headers, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    const from = `FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
      WHERE e.status='published' AND e.visibility='public' AND o.status='active' AND e.start_at>now()
      AND NOT EXISTS(SELECT 1 FROM registrations mine WHERE mine.event_id=e.id AND mine.user_id=$1 AND mine.status<>'cancelled')
      AND EXISTS(SELECT 1 FROM registrations past JOIN events source ON source.id=past.event_id
        WHERE past.user_id=$1 AND past.status IN ('confirmed','checked_in','no_show') AND source.end_at<now()
        AND (source.organizer_id=e.organizer_id OR EXISTS(SELECT 1 FROM event_tags old_tag JOIN event_tags new_tag ON new_tag.tag_id=old_tag.tag_id WHERE old_tag.event_id=source.id AND new_tag.event_id=e.id)))`;
    const result = await listSql(`${EVENT_SELECT_SQL},NULL::text AS "registrationStatus"`, from, [user.id], query, "e.start_at,e.id");
    return { ...result, data: result.data.map((row: Record<string, unknown>) => { const { onlineUrl: _url, description: _description, ...item } = row; return item; }) };
  }, { query: t.Object({ page: t.Optional(t.Numeric()), perPage: t.Optional(t.Numeric()) }) })
  .get("", async ({ headers }) => ({ data: toPublicUser((await getCurrentUser(headers.authorization))!) }))
  .patch("", async ({ headers, body }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    const [updated] = await sqlClient`UPDATE users SET
      display_name=COALESCE(${body.displayName ?? null},display_name),
      full_name=CASE WHEN ${body.fullName !== undefined} THEN ${body.fullName ?? null} ELSE full_name END,
      profile_text=CASE WHEN ${body.profileText !== undefined} THEN ${body.profileText ?? null} ELSE profile_text END,
      avatar_url=CASE WHEN ${body.avatarUrl !== undefined} THEN ${body.avatarUrl ?? null} ELSE avatar_url END,
      updated_at=now() WHERE id=${user.id}
      RETURNING id,email,display_name AS "displayName",full_name AS "fullName",profile_text AS "profileText",
        avatar_url AS "avatarUrl",status`;
    return { data: toPublicUser({ ...updated, roles: user.roles } as typeof user) };
  }, { body: t.Object({
    displayName: t.Optional(t.String({ minLength: 1, maxLength: 80 })), fullName: t.Optional(t.Nullable(t.String({ maxLength: 100 }))),
    profileText: t.Optional(t.Nullable(t.String({ maxLength: 2000 }))), avatarUrl: t.Optional(t.Nullable(t.String({ format: "uri", maxLength: 2000 }))),
  }) })
  .get("/registrations", async ({ headers, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    const { page, perPage, offset } = pagination(query.page, query.perPage);
    const viewClause: Record<string, string> = {
      upcoming: "AND e.start_at >= now() AND r.status <> 'cancelled'", past: "AND e.start_at < now()",
      waitlisted: "AND r.status='waitlisted'", cancelled: "AND r.status='cancelled'",
    };
    const clause = query.view ? viewClause[query.view] ?? "" : "";
    const rows = await sqlClient.unsafe(`SELECT r.id,r.event_id AS "eventId",r.user_id AS "userId",r.status,
      r.waitlist_position AS "waitlistPosition",r.applied_at AS "appliedAt",r.confirmed_at AS "confirmedAt",
      r.cancelled_at AS "cancelledAt",r.checked_in_at AS "checkedInAt",
      jsonb_build_object('id',e.id,'title',e.title,'summary',e.summary,'format',e.format,'venueName',e.venue_name,
        'startAt',e.start_at,'endAt',e.end_at,'capacity',e.capacity,
        'category',jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug),
        'organizer',jsonb_build_object('id',o.id,'name',o.name,'slug',o.slug,'description',o.description,
          'websiteUrl',o.website_url,'contactEmail',o.contact_email,'status',o.status),
        'tags',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'slug',t.slug) ORDER BY t.name)
          FROM event_tags et JOIN tags t ON t.id=et.tag_id WHERE et.event_id=e.id),'[]'::jsonb),
        'confirmedCount',(SELECT count(*)::int FROM registrations rc WHERE rc.event_id=e.id AND rc.status IN ('pending','confirmed','checked_in','no_show')),
        'waitlistCount',(SELECT count(*)::int FROM registrations rw WHERE rw.event_id=e.id AND rw.status='waitlisted'),
        'registrationStatus',CASE WHEN r.status='cancelled' THEN NULL ELSE r.status END) AS event,
      count(*) OVER()::int AS total FROM registrations r JOIN events e ON e.id=r.event_id
      JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
      WHERE r.user_id=$1 ${clause} ORDER BY e.start_at DESC LIMIT $2 OFFSET $3`, [user.id, perPage, offset]);
    const [count] = await sqlClient.unsafe(`SELECT count(*)::int AS total FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.user_id=$1 ${clause}`, [user.id]);
    const total = Number(count.total);
    return { data: rows.map((value: unknown) => { const { total: _total, ...row } = value as Record<string, unknown>; return row; }), pagination: { page, perPage, total } };
  }, { query: t.Object({
    view: t.Optional(t.Union([t.Literal("upcoming"),t.Literal("past"),t.Literal("waitlisted"),t.Literal("cancelled")])),
    page: t.Optional(t.Numeric()), perPage: t.Optional(t.Numeric()),
  }) })
  .put("/favorite-organizers/:organizerId", async ({ headers, params, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    if (!(await sqlClient`SELECT 1 FROM organizers WHERE id=${params.organizerId} AND status='active'`).length) throw notFound("主催者が見つかりません");
    await sqlClient`INSERT INTO user_favorite_organizers (user_id,organizer_id) VALUES (${user.id},${params.organizerId}) ON CONFLICT DO NOTHING`;
    set.status = 204;
  }, { params: t.Object({ organizerId: t.String({ pattern: UUID_PATTERN }) }) })
  .delete("/favorite-organizers/:organizerId", async ({ headers, params, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await sqlClient`DELETE FROM user_favorite_organizers WHERE user_id=${user.id} AND organizer_id=${params.organizerId}`;
    set.status = 204;
  }, { params: t.Object({ organizerId: t.String({ pattern: UUID_PATTERN }) }) })
  .put("/favorite-categories/:categoryId", async ({ headers, params, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    if (!(await sqlClient`SELECT 1 FROM categories WHERE id=${params.categoryId} AND status='active'`).length) throw notFound("カテゴリが見つかりません");
    await sqlClient`INSERT INTO user_favorite_categories (user_id,category_id) VALUES (${user.id},${params.categoryId}) ON CONFLICT DO NOTHING`;
    set.status = 204;
  }, { params: t.Object({ categoryId: t.String({ pattern: UUID_PATTERN }) }) })
  .delete("/favorite-categories/:categoryId", async ({ headers, params, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await sqlClient`DELETE FROM user_favorite_categories WHERE user_id=${user.id} AND category_id=${params.categoryId}`;
    set.status = 204;
  }, { params: t.Object({ categoryId: t.String({ pattern: UUID_PATTERN }) }) });

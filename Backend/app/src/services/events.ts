import { sqlClient } from "../db";
import type { CurrentUser } from "../lib/auth";
import { notFound } from "../lib/errors";

const eventSelect = `
  SELECT e.id,e.title,e.summary,e.description,e.format,e.venue_name AS "venueName",e.address,
    e.online_url AS "onlineUrl",e.start_at AS "startAt",e.end_at AS "endAt",e.capacity,
    e.waitlist_enabled AS "waitlistEnabled",e.application_start_at AS "applicationStartAt",
    e.application_deadline AS "applicationDeadline",e.status,e.visibility,e.published_at AS "publishedAt",
    jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug) AS category,
    jsonb_build_object('id',o.id,'name',o.name,'slug',o.slug,'description',o.description,
      'websiteUrl',o.website_url,'contactEmail',o.contact_email,'status',o.status) AS organizer,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'slug',t.slug) ORDER BY t.name)
      FROM event_tags et JOIN tags t ON t.id=et.tag_id WHERE et.event_id=e.id),'[]'::jsonb) AS tags,
    (SELECT count(*)::int FROM registrations r WHERE r.event_id=e.id AND r.status IN ('pending','confirmed','checked_in','no_show')) AS "confirmedCount",
    (SELECT count(*)::int FROM registrations r WHERE r.event_id=e.id AND r.status='waitlisted') AS "waitlistCount"`;

export const getEventById = async (eventId: string, user: CurrentUser | null, includePrivate = false) => {
  const rows = await sqlClient.unsafe(`${eventSelect},
    (SELECT status FROM registrations r WHERE r.event_id=e.id AND r.user_id=$2 AND r.status<>'cancelled' LIMIT 1) AS "registrationStatus"
    FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
    WHERE e.id=$1 ${includePrivate ? "" : "AND e.status='published'"}`, [eventId, user?.id ?? null]);
  const event = rows[0] as Record<string, unknown> | undefined;
  if (!event) throw notFound("イベントが見つかりません");
  const organizer = event.organizer as { id: string };
  const isOrganizer = Boolean(user && (await sqlClient`SELECT 1 FROM organizers o
    WHERE o.id=${organizer.id} AND (o.owner_user_id=${user.id} OR EXISTS
      (SELECT 1 FROM organizer_members m WHERE m.organizer_id=o.id AND m.user_id=${user.id}))`).length);
  if (!includePrivate && event.visibility === "private" && !user?.roles.includes("admin") && !isOrganizer) {
    throw notFound("イベントが見つかりません");
  }
  const maySeeOnlineUrl = Boolean(
    user && (user.roles.includes("admin") || event.registrationStatus === "confirmed" || event.registrationStatus === "checked_in" ||
      isOrganizer),
  );
  if (!maySeeOnlineUrl) event.onlineUrl = null;
  return event;
};

export const EVENT_SELECT_SQL = eventSelect;

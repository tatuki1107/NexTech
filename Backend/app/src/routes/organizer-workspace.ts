import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser } from "../lib/auth";
import { notFound } from "../lib/errors";
import { UUID_PATTERN, assertDateRange } from "../lib/validation";
import { requireOrganizerAccess } from "../services/access";
import { getEventById } from "../services/events";
import { monthlyAnalytics, groupedAnalytics } from "../services/analytics";

const organizerParams = t.Object({
  organizerId: t.String({ pattern: UUID_PATTERN }),
});
export const organizerWorkspaceRoutes = new Elysia()
  .get(
    "/organizers/:organizerId/members",
    async ({ headers, params }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      await requireOrganizerAccess(user, params.organizerId);
      return {
        data: await sqlClient`SELECT u.id,u.display_name AS name,u.email,u.status,
      CASE WHEN o.owner_user_id=u.id THEN 'owner' ELSE m.member_role END AS role
      FROM organizers o JOIN users u ON u.id=o.owner_user_id OR EXISTS
        (SELECT 1 FROM organizer_members membership WHERE membership.organizer_id=o.id AND membership.user_id=u.id)
      LEFT JOIN organizer_members m ON m.organizer_id=o.id AND m.user_id=u.id
      WHERE o.id=${params.organizerId} ORDER BY u.display_name,u.id`,
      };
    },
    { params: organizerParams },
  )
  .get(
    "/organizers/:organizerId/events/:eventId",
    async ({ headers, params }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      await requireOrganizerAccess(user, params.organizerId);
      const event = await getEventById(params.eventId, user, true);
      if ((event.organizer as { id: string }).id !== params.organizerId)
        throw notFound("イベントが見つかりません");
      return { data: event };
    },
    {
      params: t.Object({
        ...organizerParams.properties,
        eventId: t.String({ pattern: UUID_PATTERN }),
      }),
    },
  )
  .get(
    "/organizers/:organizerId/analytics",
    async ({ headers, params, query }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      await requireOrganizerAccess(user, params.organizerId);
      assertDateRange(query.from, query.to);
      const filter = { ...query, organizerId: params.organizerId };
      const [months, categories, [summary]] = await Promise.all([
        monthlyAnalytics(filter),
        groupedAnalytics(filter, "category", "registrations", 100),
        sqlClient`WITH scoped AS (SELECT id FROM events WHERE organizer_id=${params.organizerId}
        AND status IN ('published','completed')
        AND start_at>=(${query.from}::date::timestamp AT TIME ZONE 'Asia/Tokyo')
        AND start_at<((${query.to}::date+interval '1 day') AT TIME ZONE 'Asia/Tokyo')),
      people AS (SELECT r.user_id,count(*) AS count FROM registrations r JOIN scoped e ON e.id=r.event_id
        WHERE r.status IN ('confirmed','checked_in') GROUP BY r.user_id)
      SELECT count(r.id)::int AS "totalCount",count(r.id) FILTER(WHERE r.status<>'cancelled')::int AS "registrationCount",
        count(r.id) FILTER(WHERE r.status='cancelled')::int AS "cancelledCount",
        count(r.id) FILTER(WHERE r.status IN ('pending','confirmed','checked_in','no_show'))::int AS "confirmedCount",
        count(r.id) FILTER(WHERE r.status='checked_in')::int AS "attendedCount",
        (SELECT count(*)::int FROM people) AS "participantCount",
        (SELECT count(*)::int FROM people WHERE count>1) AS "repeatParticipantCount"
      FROM scoped e LEFT JOIN registrations r ON r.event_id=e.id`,
      ]);
      return { data: { months, categories, summary } };
    },
    {
      params: organizerParams,
      query: t.Object({
        from: t.String({ format: "date" }),
        to: t.String({ format: "date" }),
      }),
    },
  );

import { Elysia, t } from "elysia";
import { getCurrentUser } from "../lib/auth";
import { pagination } from "../lib/validation";
import { queryPage } from "../db/pagination";
import { EVENT_SELECT_SQL } from "../services/events";

const pastMatch = `FROM registrations past_r JOIN events past ON past.id=past_r.event_id
  WHERE past_r.user_id=$1 AND past_r.status IN ('confirmed','checked_in') AND past.status IN ('published','completed') AND past.end_at<now()`;
const sameOrganizer = `EXISTS (SELECT 1 ${pastMatch} AND past.organizer_id=e.organizer_id)`;
const sharedTags = `EXISTS (SELECT 1 ${pastMatch} AND EXISTS
  (SELECT 1 FROM event_tags a JOIN event_tags b ON a.tag_id=b.tag_id WHERE a.event_id=past.id AND b.event_id=e.id))`;

export const recommendationRoutes = new Elysia({ prefix: "/me" }).get(
  "/recommended-events",
  async ({ headers, query }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    const result = await queryPage(
      `${EVENT_SELECT_SQL},NULL::text AS "registrationStatus",count(*) OVER()::int AS total,
    ${sameOrganizer} AS "sameOrganizer",${sharedTags} AS "sharedTags"
    FROM events e JOIN categories c ON c.id=e.category_id JOIN organizers o ON o.id=e.organizer_id
    WHERE e.status='published' AND e.visibility='public' AND o.status='active' AND e.start_at>now()
      AND (e.application_deadline IS NULL OR e.application_deadline>now())
      AND NOT EXISTS(SELECT 1 FROM registrations current_r WHERE current_r.event_id=e.id AND current_r.user_id=$1 AND current_r.status<>'cancelled')
      AND (${sameOrganizer} OR ${sharedTags}) ORDER BY e.start_at,e.id`,
      [user.id],
      pagination(query.page, query.perPage),
    );
    return {
      ...result,
      data: result.data.map((row) => {
        const {
          onlineUrl: _onlineUrl,
          description: _description,
          ...item
        } = row;
        return item;
      }),
    };
  },
  {
    query: t.Object({
      page: t.Optional(t.Numeric()),
      perPage: t.Optional(t.Numeric()),
    }),
  },
);

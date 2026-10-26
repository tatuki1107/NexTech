import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser } from "../lib/auth";
import { notFound } from "../lib/errors";
import { pagination, UUID_PATTERN } from "../lib/validation";

const settingsSelect = `SELECT COALESCE(s.registration_updates,true) AS "registrationUpdates",
  COALESCE(s.event_reminders,true) AS "eventReminders", COALESCE(s.recommendations,false) AS recommendations
  FROM users u LEFT JOIN user_notification_settings s ON s.user_id=u.id WHERE u.id=$1`;

export const notificationRoutes = new Elysia({ prefix: "/me" })
  .get("/notification-settings", async ({ headers }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    const [settings] = await sqlClient.unsafe(settingsSelect, [user.id]);
    return { data: settings };
  })
  .patch(
    "/notification-settings",
    async ({ headers, body }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      const [settings] = await sqlClient`INSERT INTO user_notification_settings
      (user_id,registration_updates,event_reminders,recommendations)
      VALUES (${user.id},${body.registrationUpdates ?? true},${body.eventReminders ?? true},${body.recommendations ?? false})
      ON CONFLICT (user_id) DO UPDATE SET
        registration_updates=COALESCE(${body.registrationUpdates ?? null},user_notification_settings.registration_updates),
        event_reminders=COALESCE(${body.eventReminders ?? null},user_notification_settings.event_reminders),
        recommendations=COALESCE(${body.recommendations ?? null},user_notification_settings.recommendations),updated_at=now()
      RETURNING registration_updates AS "registrationUpdates",event_reminders AS "eventReminders",recommendations`;
      return { data: settings };
    },
    {
      body: t.Object({
        registrationUpdates: t.Optional(t.Boolean()),
        eventReminders: t.Optional(t.Boolean()),
        recommendations: t.Optional(t.Boolean()),
      }),
    },
  )
  .get(
    "/notifications",
    async ({ headers, query }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      const { page, perPage, offset } = pagination(query.page, query.perPage);
      const unreadOnly = query.unreadOnly ?? false;
      const [counts] = await sqlClient`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE read_at IS NULL)::int AS unread FROM user_notifications
      WHERE user_id=${user.id}`;
      const rows =
        await sqlClient`SELECT id,event_id AS "eventId",kind,title,message,read_at AS "readAt",created_at AS "createdAt"
      FROM user_notifications WHERE user_id=${user.id} AND (NOT ${unreadOnly} OR read_at IS NULL)
      ORDER BY created_at DESC,id DESC LIMIT ${perPage} OFFSET ${offset}`;
      return {
        data: rows,
        unreadCount: Number(counts.unread),
        pagination: {
          page,
          perPage,
          total: Number(unreadOnly ? counts.unread : counts.total),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        perPage: t.Optional(t.Numeric()),
        unreadOnly: t.Optional(t.Boolean()),
      }),
    },
  )
  .put("/notifications/read-all", async ({ headers, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    await sqlClient`UPDATE user_notifications SET read_at=now() WHERE user_id=${user.id} AND read_at IS NULL`;
    set.status = 204;
  })
  .put(
    "/notifications/:notificationId/read",
    async ({ headers, params, set }) => {
      const user = (await getCurrentUser(headers.authorization))!;
      const rows =
        await sqlClient`UPDATE user_notifications SET read_at=COALESCE(read_at,now())
      WHERE id=${params.notificationId} AND user_id=${user.id} RETURNING id`;
      if (!rows.length) throw notFound("通知が見つかりません");
      set.status = 204;
    },
    {
      params: t.Object({ notificationId: t.String({ pattern: UUID_PATTERN }) }),
    },
  );

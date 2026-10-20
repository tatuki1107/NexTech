import { sqlClient } from "../db";

type NotificationExecutor = Pick<typeof sqlClient, "unsafe">;
type RegistrationNotice = {
  userId: string;
  eventId: string;
  title: string;
  message: string;
};

// Called inside the business transaction so a rolled-back action cannot leave a notification.
export const notifyRegistration = async (
  tx: NotificationExecutor,
  notice: RegistrationNotice,
): Promise<void> => {
  await tx.unsafe(
    `INSERT INTO user_notifications (user_id,event_id,kind,title,message,dedupe_key)
    SELECT u.id,$2,'registration',$3,$4,$5 FROM users u
    LEFT JOIN user_notification_settings s ON s.user_id=u.id
    WHERE u.id=$1 AND u.status='active' AND u.deleted_at IS NULL AND COALESCE(s.registration_updates,true)`,
    [
      notice.userId,
      notice.eventId,
      notice.title,
      notice.message,
      crypto.randomUUID(),
    ],
  );
};

export const notifyPublishedEvent = async (
  tx: NotificationExecutor,
  eventId: string,
): Promise<void> => {
  await tx.unsafe(
    `INSERT INTO user_notifications (user_id,event_id,kind,title,message,dedupe_key)
    SELECT u.id,e.id,'recommendation','フォロー中の新着イベント',e.title,'published:'||e.id::text
    FROM events e JOIN organizers o ON o.id=e.organizer_id AND o.status='active'
    JOIN users u ON u.status='active' AND u.deleted_at IS NULL
    JOIN user_notification_settings s ON s.user_id=u.id AND s.recommendations
    WHERE e.id=$1 AND e.status='published' AND e.visibility='public'
      AND (EXISTS (SELECT 1 FROM user_favorite_organizers f WHERE f.user_id=u.id AND f.organizer_id=e.organizer_id)
        OR EXISTS (SELECT 1 FROM user_favorite_categories f WHERE f.user_id=u.id AND f.category_id=e.category_id))
    ON CONFLICT (user_id,dedupe_key) DO NOTHING`,
    [eventId],
  );
};

// Run every minute from a scheduler. Unique keys make retries/overlapping runs harmless.
// Only in-app notifications are produced; this does not send email or browser push.
export const generateEventReminders = async (
  now = new Date(),
): Promise<number> => {
  const rows = await sqlClient.unsafe(
    `INSERT INTO user_notifications (user_id,event_id,kind,title,message,dedupe_key)
    SELECT r.user_id,e.id,'reminder',reminder.title,e.title,
      'reminder:'||r.id::text||':'||extract(epoch FROM e.start_at)::text||':'||reminder.name
    FROM registrations r JOIN events e ON e.id=r.event_id
    JOIN organizers o ON o.id=e.organizer_id AND o.status='active'
    JOIN users u ON u.id=r.user_id AND u.status='active' AND u.deleted_at IS NULL
    LEFT JOIN user_notification_settings s ON s.user_id=r.user_id
    CROSS JOIN (VALUES ('day','開催前日のリマインド',interval '23 hours',interval '24 hours'),
      ('hour','開催1時間前のリマインド',interval '0 hours',interval '1 hour')) AS reminder(name,title,min_wait,max_wait)
    WHERE r.status='confirmed' AND e.status='published' AND COALESCE(s.event_reminders,true)
      AND e.start_at > $1::timestamptz + reminder.min_wait AND e.start_at <= $1::timestamptz + reminder.max_wait
    ON CONFLICT (user_id,dedupe_key) DO NOTHING RETURNING id`,
    [now.toISOString()],
  );
  return rows.length;
};

import { sqlClient } from "../db";
import { notifyRegistration } from "./notifications";

// The caller holds the event row lock; all capacity-changing paths use that lock.
export async function promoteWaitlist(
  tx: Pick<typeof sqlClient, "unsafe">,
  eventId: string,
): Promise<void> {
  const [event] = await tx.unsafe(
    "SELECT e.capacity,e.status,e.start_at,o.status AS organizer_status FROM events e JOIN organizers o ON o.id=e.organizer_id WHERE e.id=$1",
    [eventId],
  );
  if (
    !event ||
    event.status !== "published" ||
    event.organizer_status !== "active" ||
    new Date(String(event.start_at)) <= new Date()
  )
    return;
  const [occupied] = await tx.unsafe(
    "SELECT count(*)::int AS count FROM registrations WHERE event_id=$1 AND status IN ('pending','confirmed','checked_in','no_show')",
    [eventId],
  );
  const seats = Math.max(0, Number(event.capacity) - Number(occupied.count));
  if (!seats) return;
  const waiting = await tx.unsafe(
    `SELECT r.id,r.user_id FROM registrations r JOIN users u ON u.id=r.user_id
    WHERE r.event_id=$1 AND r.status='waitlisted' AND u.status='active' AND u.deleted_at IS NULL
    ORDER BY r.waitlist_position,r.applied_at,r.id LIMIT $2 FOR UPDATE OF r`,
    [eventId, seats],
  );
  for (const registration of waiting) {
    await tx.unsafe(
      "UPDATE registrations SET status='confirmed',waitlist_position=NULL,confirmed_at=now(),updated_at=now(),version=version+1 WHERE id=$1",
      [registration.id],
    );
    await tx.unsafe(
      "INSERT INTO registration_status_histories(registration_id,from_status,to_status,reason) VALUES($1,'waitlisted','confirmed','automatic_promotion')",
      [registration.id],
    );
    await notifyRegistration(tx, {
      userId: String(registration.user_id),
      eventId,
      title: "キャンセル待ちから参加確定になりました",
      message: "空き枠ができたため参加が確定しました。",
    });
  }
}

// Stored waitlist_position is a queue-order key, not a display rank.
// This expression expects the registration table alias "r".
export const WAITLIST_RANK_SQL = `CASE WHEN r.status='waitlisted' THEN
  (SELECT count(*)::int FROM registrations ahead WHERE ahead.event_id=r.event_id AND ahead.status='waitlisted'
    AND (ahead.waitlist_position,ahead.applied_at,ahead.id) <= (r.waitlist_position,r.applied_at,r.id))
  ELSE NULL END`;

import { sqlClient } from "../db";
import { ApiError, notFound } from "../lib/errors";
import { notifyPublishedEvent, notifyRegistration } from "./notifications";
import { promoteWaitlist } from "./registrations";

type EventStatus = "draft" | "published" | "cancelled" | "completed";

export async function changeEventStatus(
  eventId: string,
  actorId: string,
  status: EventStatus,
  reason?: string,
  isAdmin = false,
): Promise<void> {
  await sqlClient.begin(async (tx) => {
    const [current] =
      await tx`SELECT * FROM events WHERE id=${eventId} FOR UPDATE`;
    if (!current) throw notFound("イベントが見つかりません");
    const [organizer] =
      await tx`SELECT status FROM organizers WHERE id=${current.organizer_id} FOR SHARE`;
    if (
      (!isAdmin || status === "published") &&
      organizer?.status !== "active"
    ) {
      throw new ApiError(
        422,
        "BUSINESS_RULE_ERROR",
        "停止中の主催者はこの操作を行えません",
      );
    }
    if (current.status === "cancelled" && status !== "cancelled") {
      throw new ApiError(
        422,
        "BUSINESS_RULE_ERROR",
        "中止済みイベントの状態は変更できません",
      );
    }
    const [moderation] = await tx`SELECT action FROM moderation_actions
      WHERE target_type='event' AND target_id=${eventId} AND action IN ('draft','published')
      ORDER BY (metadata->>'eventVersion')::int DESC NULLS LAST,created_at DESC,id DESC LIMIT 1`;
    if (!isAdmin && status === "published" && moderation?.action === "draft") {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "運営により公開停止中です。再公開には管理者の操作が必要です",
      );
    }
    // A draft can also be administratively stopped before its first publication.
    if (
      current.status === status &&
      !(isAdmin && status === "draft" && moderation?.action !== "draft")
    )
      return;
    await tx`UPDATE events SET status=${status},
      published_at=CASE WHEN ${status}='published' THEN COALESCE(published_at,now()) ELSE published_at END,
      updated_at=now(),version=version+1 WHERE id=${eventId}`;
    if (isAdmin)
      await tx`INSERT INTO moderation_actions(actor_user_id,target_type,target_id,action,reason,metadata)
      VALUES(${actorId},'event',${eventId},${status},${reason ?? null},
      ${JSON.stringify({ fromStatus: current.status, eventVersion: Number(current.version) + 1 })}::jsonb)`;
    await tx`INSERT INTO event_change_logs(event_id,changed_by_user_id,change_type,before_data,after_data)
      VALUES(${eventId},${actorId},'status_changed',${JSON.stringify({ status: current.status })}::jsonb,
      ${JSON.stringify({ status, reason })}::jsonb)`;
    await tx`INSERT INTO operation_logs(actor_user_id,action,resource_type,resource_id)
      VALUES(${actorId},'event.status_changed','event',${eventId})`;
    if (status === "published" && current.status !== "published") {
      // Paused events may have gained seats; reconcile the queue under the event lock.
      await promoteWaitlist(tx, eventId);
      await notifyPublishedEvent(tx, eventId);
    }
    if (status === "cancelled" && current.status !== "cancelled") {
      const registrations =
        await tx`SELECT user_id FROM registrations WHERE event_id=${eventId} AND status<>'cancelled'`;
      for (const registration of registrations)
        await notifyRegistration(tx, {
          userId: String(registration.user_id),
          eventId,
          title: "イベントが中止されました",
          message: String(current.title),
        });
    }
  });
}

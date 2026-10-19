import { t } from "elysia";
import { sqlClient } from "../db";
import type { CurrentUser } from "../lib/auth";
import { ApiError, notFound } from "../lib/errors";
import { notifyPublishedEvent, notifyRegistration } from "./notifications";

export const eventStatusSchema = t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("cancelled"), t.Literal("completed")]);
export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export const changeEventStatus = async (eventId: string, user: CurrentUser, status: EventStatus, reason: string | undefined, moderation: boolean): Promise<void> => {
  await sqlClient.begin(async (tx) => {
    const [current] = await tx`SELECT e.*,o.status AS organizer_status FROM events e JOIN organizers o ON o.id=e.organizer_id WHERE e.id=${eventId} FOR UPDATE OF e`;
    if (!current) throw notFound("イベントが見つかりません");
    if ((current.status === "cancelled" || current.status === "completed") && status !== current.status) {
      throw new ApiError(422, "BUSINESS_RULE_ERROR", "終了・中止済みイベントの状態は変更できません");
    }
    if (status === "published" && (current.organizer_status !== "active" || new Date(current.start_at as string) <= new Date())) {
      throw new ApiError(422, "BUSINESS_RULE_ERROR", "停止中の主催者または開始済みイベントは公開できません");
    }
    if (!moderation && current.moderation_blocked && status === "published") throw new ApiError(403, "FORBIDDEN", "管理者による公開停止は管理者のみ解除できます");
    if (status === "completed" && new Date(current.end_at as string) > new Date()) throw new ApiError(422, "BUSINESS_RULE_ERROR", "開催終了前です");
    if (moderation && status !== current.status && !reason?.trim()) throw new ApiError(422, "BUSINESS_RULE_ERROR", "管理者による状態変更には理由が必要です");
    await tx`UPDATE events SET status=${status},moderation_blocked=CASE WHEN ${moderation} THEN ${status === "draft"} ELSE moderation_blocked END,published_at=CASE WHEN ${status}='published' THEN COALESCE(published_at,now()) ELSE published_at END,updated_at=now(),version=version+1 WHERE id=${eventId}`;
    if (moderation) await tx`INSERT INTO moderation_actions (actor_user_id,target_type,target_id,action,reason,metadata) VALUES (${user.id},'event',${eventId},${status},${reason ?? null},${{ fromStatus: current.status }}::jsonb)`;
    await tx`INSERT INTO event_change_logs (event_id,changed_by_user_id,change_type,before_data,after_data) VALUES (${eventId},${user.id},'status_changed',${{ status: current.status }}::jsonb,${{ status, reason }}::jsonb)`;
    await tx`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id) VALUES (${user.id},'event.status','event',${eventId})`;
    if (status === "published" && current.status !== status) await notifyPublishedEvent(tx, eventId);
    if (status === "cancelled" && current.status !== status) {
      const registrations = await tx`SELECT user_id FROM registrations WHERE event_id=${eventId} AND status<>'cancelled'`;
      for (const registration of registrations) await notifyRegistration(tx, { userId: String(registration.user_id), eventId, title: "イベントが中止されました", message: String(current.title) });
    }
  });
};

import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { getCurrentUser } from "../lib/auth";
import { ApiError, notFound } from "../lib/errors";
import { assertRateLimit } from "../lib/rate-limit";
import { UUID_PATTERN } from "../lib/validation";
import { notifyRegistration } from "../services/notifications";

export const registrationRoutes = new Elysia({ prefix: "/events/:eventId" })
  .post("/registrations", async ({ params, headers, body, set }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    assertRateLimit(`registration:${user.id}`, 20, 60_000);
    const result = await sqlClient.begin(async (tx) => {
      const [event] = await tx`SELECT * FROM events WHERE id=${params.eventId} FOR UPDATE`;
      if (!event) throw notFound("イベントが見つかりません");
      if (event.visibility === "private" && !user.roles.includes("admin") && event.created_by !== user.id && !(await tx`SELECT 1 FROM organizer_members WHERE organizer_id=${event.organizer_id} AND user_id=${user.id}`).length && !(await tx`SELECT 1 FROM organizers WHERE id=${event.organizer_id} AND owner_user_id=${user.id}`).length) {
        throw notFound("イベントが見つかりません");
      }
      const now = new Date();
      if (event.status !== "published") throw new ApiError(422, "BUSINESS_RULE_ERROR", "受付中のイベントではありません");
      if (new Date(event.start_at as string) <= now || (event.application_start_at && new Date(event.application_start_at as string) > now) || (event.application_deadline && new Date(event.application_deadline as string) < now)) {
        throw new ApiError(410, "REGISTRATION_CLOSED", "申込期間外です");
      }
      const [existing] = await tx`SELECT id,status FROM registrations WHERE event_id=${params.eventId} AND user_id=${user.id}`;
      if (existing && existing.status !== 'cancelled') {
        throw new ApiError(409, "CONFLICT", "既にこのイベントへ申し込んでいます");
      }
      const [{ count }] = await tx`SELECT count(*)::int AS count FROM registrations WHERE event_id=${params.eventId} AND status IN ('pending','confirmed','checked_in','no_show')`;
      let status: "confirmed" | "waitlisted";
      let waitlistPosition: number | null = null;
      if (Number(count) < Number(event.capacity)) {
        status = "confirmed";
      } else if (event.waitlist_enabled) {
        status = "waitlisted";
        const [position] = await tx`SELECT COALESCE(max(waitlist_position),0)::int+1 AS position FROM registrations WHERE event_id=${params.eventId} AND status='waitlisted'`;
        waitlistPosition = Number(position.position);
      } else {
        throw new ApiError(422, "BUSINESS_RULE_ERROR", "定員に達しています");
      }
      const [registration] = existing
        ? await tx`UPDATE registrations SET status=${status},waitlist_position=${waitlistPosition},
            applied_at=now(),confirmed_at=${status === "confirmed" ? new Date().toISOString() : null},
            cancelled_at=NULL,checked_in_at=NULL,cancellation_reason=NULL,checkin_note=NULL,
            updated_at=now(),version=version+1 WHERE id=${existing.id} RETURNING id`
        : await tx`INSERT INTO registrations
        (event_id,user_id,status,waitlist_position,confirmed_at)
        VALUES (${params.eventId},${user.id},${status},${waitlistPosition},${status === "confirmed" ? new Date().toISOString() : null}) RETURNING id`;
      await tx`INSERT INTO registration_status_histories
        (registration_id,from_status,to_status,changed_by_user_id,reason)
        VALUES (${registration.id},${existing ? 'cancelled' : null},${status},${user.id},${body?.note ?? "application"})`;
      await tx`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id)
        VALUES (${user.id},'registration.apply','registration',${registration.id})`;
      await notifyRegistration(tx, { userId: user.id, eventId: params.eventId,
        title: status === "confirmed" ? "申込み完了しました" : "キャンセル待ちへ登録しました", message: String(event.title) });
      return {
        registrationId: registration.id, eventId: params.eventId, status, waitlistPosition,
        message: status === "confirmed" ? "参加申込が確定しました" : "キャンセル待ちへ登録しました",
      };
    });
    set.status = 201;
    return { data: result };
  }, {
    params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }),
    body: t.Optional(t.Object({ note: t.Optional(t.String({ maxLength: 255 })) })),
  })
  .delete("/registration", async ({ params, headers }) => {
    const user = (await getCurrentUser(headers.authorization))!;
    const registration = await sqlClient.begin(async (tx) => {
      await tx`SELECT id FROM events WHERE id=${params.eventId} FOR UPDATE`;
      const [current] = await tx`SELECT * FROM registrations
        WHERE event_id=${params.eventId} AND user_id=${user.id} AND status<>'cancelled' FOR UPDATE`;
      if (!current) throw notFound("有効な申込が見つかりません");
      if (!["pending", "confirmed", "waitlisted"].includes(current.status as string)) {
        throw new ApiError(422, "BUSINESS_RULE_ERROR", "受付済みの申込はキャンセルできません");
      }
      const previousStatus = current.status as string;
      const [cancelled] = await tx`UPDATE registrations SET status='cancelled',waitlist_position=NULL,
        cancelled_at=now(),updated_at=now(),version=version+1 WHERE id=${current.id}
        RETURNING id,event_id AS "eventId",user_id AS "userId",status,waitlist_position AS "waitlistPosition",
          applied_at AS "appliedAt",confirmed_at AS "confirmedAt",cancelled_at AS "cancelledAt",checked_in_at AS "checkedInAt"`;
      await tx`INSERT INTO registration_status_histories
        (registration_id,from_status,to_status,changed_by_user_id,reason)
        VALUES (${current.id},${previousStatus},'cancelled',${user.id},'user_cancelled')`;
      await tx`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id)
        VALUES (${user.id},'registration.cancel','registration',${current.id})`;
      await notifyRegistration(tx, { userId: user.id, eventId: params.eventId,
        title: "申込みをキャンセルしました", message: "参加申込みのキャンセルを受け付けました。" });
      if (previousStatus === "confirmed" || previousStatus === "pending") {
        const [next] = await tx`SELECT * FROM registrations WHERE event_id=${params.eventId} AND status='waitlisted'
          ORDER BY waitlist_position,applied_at FOR UPDATE SKIP LOCKED LIMIT 1`;
        if (next) {
          await tx`UPDATE registrations SET status='confirmed',waitlist_position=NULL,confirmed_at=now(),updated_at=now(),version=version+1 WHERE id=${next.id}`;
          await tx`INSERT INTO registration_status_histories
            (registration_id,from_status,to_status,reason)
            VALUES (${next.id},'waitlisted','confirmed','automatic_promotion')`;
          await notifyRegistration(tx, { userId: String(next.user_id), eventId: params.eventId,
            title: "キャンセル待ちから参加確定になりました", message: "空き枠ができたため参加が確定しました。" });
        }
      }
      return cancelled;
    });
    return { data: registration };
  }, { params: t.Object({ eventId: t.String({ pattern: UUID_PATTERN }) }) });

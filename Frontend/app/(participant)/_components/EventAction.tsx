"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { apiRequest, errorMessage } from "../_lib/api";
import { formatEventDate, type EventDetailData } from "../_lib/event-detail";
import { useParticipant } from "./ParticipantProvider";
import { getEventActionPolicy } from "../_lib/event-action";
export function EventAction({
  event,
  onChanged,
  notice,
}: {
  event: EventDetailData;
  onChanged: (message: string) => void;
  notice?: string;
}) {
  const session = useParticipant();
  const [busy, setBusy] = useState(false);
  const confirmation = useRef<HTMLDialogElement>(null);
  const [confirmationError, setConfirmationError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const policy = getEventActionPolicy(event, now);
  const registered = policy.kind === "cancel";
  const waitlisted = event.seatsLeft === 0;
  const applyLabel = waitlisted ? "キャンセル待ちに申し込む" : "参加を申し込む";
  const confirmationTitle = registered
    ? "申込をキャンセルしますか？"
    : waitlisted
      ? "キャンセル待ちに申し込みますか？"
      : "このイベントに参加を申し込みますか？";
  const venue = [event.venueName, event.format === "online" || event.format === "hybrid" ? "オンライン" : null]
    .filter(Boolean).join(" / ") || "未定";
  const isFloatingApply = policy.kind === "apply" && !policy.disabledReason;
  async function submit() {
    if (busy || policy.disabledReason) return;
    if (!session.user) {
      window.location.assign(
        `/login?returnTo=${encodeURIComponent("/events/" + event.id)}`,
      );
      return;
    }
    setBusy(true);
    setMessage("");
    setConfirmationError("");
    try {
      const result = await apiRequest<{
        data: { status: string; waitlistPosition: number | null };
      }>(
        `/events/${event.id}/${registered ? "registration" : "registrations"}`,
        {
          method: registered ? "DELETE" : "POST",
          ...(registered ? {} : { body: "{}" }),
        },
      );
      confirmation.current?.close();
      const success = registered
          ? "申込をキャンセルしました。"
          : result.data.status === "waitlisted"
            ? `キャンセル待ちで受け付けました（現在${result.data.waitlistPosition}番目）。`
            : "参加申込が確定しました。";
      onChanged(success);
      await session.reload();
    } catch (error) {
      if (confirmation.current?.open) setConfirmationError(errorMessage(error));
      else setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="event-action">
      {policy.kind === "history" ? (
        <p>現在公開されていないイベントの申込履歴です。</p>
      ) : (
        <>
          {event.registrationStatus === "confirmed" && (
            <p role="status">参加確定で申込済みです。</p>
          )}
          {event.registrationStatus === "waitlisted" && (
            <p>キャンセル待ちで申込済み</p>
          )}
          <button
            type="button"
            className={
              isFloatingApply
                ? "primary-button floating-apply-button"
                : "primary-button"
            }
            disabled={busy || session.loading || Boolean(policy.disabledReason)}
            aria-haspopup={session.user ? "dialog" : undefined}
            onClick={() => {
              if (session.user) {
                setConfirmationError("");
                confirmation.current?.showModal();
              } else {
                void submit();
              }
            }}
          >
            {busy
              ? "処理中…"
              : policy.disabledReason
                ? policy.disabledReason
                : registered
                  ? "申込をキャンセルする"
                  : !session.user
                    ? "ログインして申し込む"
                    : applyLabel}
          </button>
        </>
      )}
      {policy.kind !== "history" && session.user && (
        <dialog
          ref={confirmation}
          className="action-modal registration-confirmation-dialog"
          aria-labelledby="confirm-registration-title"
          aria-describedby="confirm-registration-description"
          onCancel={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <h2 id="confirm-registration-title">
            {registered || waitlisted ? confirmationTitle : <>このイベントに<br />参加を申し込みますか？</>}
          </h2>
          <div id="confirm-registration-description" className="registration-confirmation-details">
            <strong>{event.title}</strong>
            <dl>
              <dt><Image src="/icons/figma-flow/calendar.svg" width={20} height={20} alt="" />日時</dt><dd>{formatEventDate(event.effectiveStartAt ?? event.startAt, event.endAt)}</dd>
              <dt><Image src="/icons/figma-flow/location.svg" width={24} height={24} alt="" />場所</dt><dd>{venue}</dd>
              <dt><Image src="/icons/figma-flow/organizer.svg" width={20} height={20} alt="" />主催</dt><dd>{event.organizerName}</dd>
            </dl>
          </div>
          {confirmationError && <p role="alert">{confirmationError}</p>}
          <div className="modal-actions">
            <button
              className="modal-secondary"
              type="button"
              onClick={() => confirmation.current?.close()}
              disabled={busy}
            >
              {registered ? "申込を残す" : "戻る"}
            </button>
            <button
              className={registered ? "modal-danger" : "primary-button"}
              type="button"
              onClick={() => void submit()}
              disabled={busy || Boolean(policy.disabledReason)}
            >
              {busy ? "処理中…" : registered ? "キャンセルを確定" : "申し込む"}
            </button>
          </div>
        </dialog>
      )}
      {message ? <p role="alert">{message}</p> : notice && <p role="status">{notice}</p>}
    </div>
  );
}

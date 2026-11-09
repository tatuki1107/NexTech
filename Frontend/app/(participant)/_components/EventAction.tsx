"use client";
import { useEffect, useRef, useState } from "react";
import { apiRequest, errorMessage } from "../_lib/api";
import type { EventDetailData } from "../_lib/event-detail";
import { useParticipant } from "./ParticipantProvider";
import { getEventActionPolicy } from "../_lib/event-action";
export function EventAction({
  event,
  onChanged,
}: {
  event: EventDetailData;
  onChanged: () => void;
}) {
  const session = useParticipant();
  const [busy, setBusy] = useState(false);
  const cancelDialog = useRef<HTMLDialogElement>(null);
  const [cancelError, setCancelError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const policy = getEventActionPolicy(event, now);
  const registered = policy.kind === "cancel";
  const isFloatingApply = policy.kind === "apply" && !policy.disabledReason;
  async function submit() {
    if (!session.user) {
      window.location.assign(
        `/login?returnTo=${encodeURIComponent("/events/" + event.id)}`,
      );
      return;
    }
    setBusy(true);
    setMessage("");
    setCancelError("");
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
      if (registered) cancelDialog.current?.close();
      setMessage(
        registered
          ? "申込をキャンセルしました。"
          : result.data.status === "waitlisted"
            ? `キャンセル待ちで受け付けました（現在${result.data.waitlistPosition}番目）。`
            : "参加申込が確定しました。",
      );
      await session.reload();
      onChanged();
    } catch (error) {
      if (registered && cancelDialog.current?.open) setCancelError(errorMessage(error));
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
            aria-haspopup={registered ? "dialog" : undefined}
            onClick={() => {
              if (registered && session.user) {
                setCancelError("");
                cancelDialog.current?.showModal();
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
                    : event.seatsLeft === 0
                      ? "キャンセル待ちに申し込む"
                      : "参加を申し込む"}
          </button>
        </>
      )}
      {registered && (
        <dialog
          ref={cancelDialog}
          className="action-modal registration-cancel-dialog"
          aria-labelledby="cancel-registration-title"
          aria-describedby="cancel-registration-description"
          onCancel={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <h2 id="cancel-registration-title">申込をキャンセルしますか？</h2>
          <p id="cancel-registration-description">対象：{event.title}</p>
          {cancelError && <p role="alert">{cancelError}</p>}
          <div className="modal-actions">
            <button
              className="modal-secondary"
              type="button"
              onClick={() => cancelDialog.current?.close()}
              disabled={busy}
            >
              申込を残す
            </button>
            <button
              className="modal-danger"
              type="button"
              onClick={() => void submit()}
              disabled={busy || Boolean(policy.disabledReason)}
            >
              {busy ? "処理中…" : "キャンセルを確定"}
            </button>
          </div>
        </dialog>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}

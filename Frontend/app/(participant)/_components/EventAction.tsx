"use client";
import { useEffect, useState } from "react";
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
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const policy = getEventActionPolicy(event, now);
  const registered = policy.kind === "cancel";
  async function submit() {
    if (!session.user) {
      window.location.assign(
        `/login?returnTo=${encodeURIComponent("/events/" + event.id)}`,
      );
      return;
    }
    if (registered && !confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setMessage("");
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
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }
  return (
    <div className="sticky-action">
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
          {confirming && (
            <div role="alert">
              <p>このイベントへの申込をキャンセルしますか？</p>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                戻る
              </button>
            </div>
          )}
          <button
            type="button"
            className="primary-button"
            disabled={busy || session.loading || Boolean(policy.disabledReason)}
            onClick={() => void submit()}
          >
            {busy
              ? "処理中…"
              : policy.disabledReason
                ? policy.disabledReason
                : registered
                  ? confirming
                    ? "申込キャンセルを確定する"
                    : "申込をキャンセルする"
                  : !session.user
                    ? "ログインして申し込む"
                    : event.seatsLeft === 0
                      ? "キャンセル待ちに申し込む"
                      : "参加を申し込む"}
          </button>
          {message && <p role="status">{message}</p>}
        </>
      )}
    </div>
  );
}

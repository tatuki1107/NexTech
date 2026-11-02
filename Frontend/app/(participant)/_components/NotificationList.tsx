"use client";
import { useState } from "react";
import { apiRequest, errorMessage } from "../_lib/api";
import { useApiData } from "../_lib/use-api-data";
import type { Notification } from "../_lib/types";
import { ApiState } from "./ApiState";
import { useParticipant } from "./ParticipantProvider";

export function NotificationList() {
  const { data, error, loading, reload } = useApiData<Notification[]>(
    "/me/notifications",
    true,
  );
  const session = useParticipant();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  async function mark(notification?: Notification) {
    setBusy(true);
    setActionError("");
    try {
      await apiRequest(
        notification
          ? `/me/notifications/${notification.id}/read`
          : "/me/notifications/read-all",
        { method: "PUT" },
      );
      await session.reload();
      reload();
      if (notification?.eventId)
        window.location.assign(`/events/${notification.eventId}`);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="notifications-page">
      <div className="page-heading compact-heading">
        <h1>通知</h1>
        <p>新着情報とイベントからのお知らせ</p>
      </div>
      <ApiState loading={loading} error={error} retry={reload} />
      {actionError && <p role="alert">{actionError}</p>}
      <div className="notification-list">
        {data?.map((notification) => (
          <button
            type="button"
            className="notification-card"
            key={notification.id}
            disabled={busy}
            onClick={() => void mark(notification)}
          >
            {!notification.readAt && (
              <span className="notification-bullet" aria-label="未読" />
            )}
            <span>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <time dateTime={notification.createdAt}>
                {new Date(notification.createdAt).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                })}
              </time>
            </span>
          </button>
        ))}
      </div>
      {data?.length === 0 && <p className="empty-state">通知はありません。</p>}
      <button
        type="button"
        className="mark-all-read"
        disabled={busy || !data?.some((notification) => !notification.readAt)}
        onClick={() => void mark()}
      >
        すべて既読にする
      </button>
    </section>
  );
}

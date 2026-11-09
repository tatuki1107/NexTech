"use client";
import { useState } from "react";
import { useApiData } from "../_lib/use-api-data";
import type { ParticipantEvent, Registration } from "../_lib/types";
import { useParticipant } from "./ParticipantProvider";
import { ParticipantEventCard } from "./ParticipantEventCard";
import { RequireLogin } from "./RequireLogin";
import { ApiState } from "./ApiState";
import { mergeRegistrationHistory } from "../_lib/registration-history";
function MyEventList() {
  const [view, setView] = useState("upcoming");
  const { user } = useParticipant();
  const { data, error, loading, reload } = useApiData<Registration[]>(
    `/me/registrations?view=${view}`,
    true,
  );
  const isHistory = view === "past";
  const cancelled = useApiData<Registration[]>(
    "/me/registrations?view=cancelled",
    true,
    "",
    isHistory,
  );
  const recommendations = useApiData<ParticipantEvent[]>(
    "/me/recommended-events",
    true,
  );
  const rows = isHistory
    ? data && cancelled.data && mergeRegistrationHistory(data, cancelled.data)
    : data?.filter((row) => view !== "upcoming" || row.status !== "waitlisted");
  return (
    <>
      <div className="profile-summary">
        <div className="avatar">{user?.displayName.slice(0, 1)}</div>
        <div>
          <b>{user?.displayName}</b>
          <p>{user?.email}</p>
        </div>
      </div>
      <div className="segmented-tabs my-event-tabs" role="group" aria-label="申込の表示切り替え">
        {[
          ["upcoming", "参加予定"],
          ["waitlisted", "キャンセル待ち"],
          ["past", "参加履歴"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={view === value ? "is-active" : ""}
            aria-pressed={view === value}
            onClick={() => setView(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ApiState
        loading={loading || (isHistory && cancelled.loading)}
        error={error || (isHistory ? cancelled.error : undefined)}
        retry={() => {
          reload();
          if (isHistory) cancelled.reload();
        }}
      />
      {rows &&
        (rows.length ? (
          <div className="my-event-list">
            {rows.map((row) => (
              <div key={row.id}>
                {row.status === "waitlisted" && (
                  <p>キャンセル待ち：現在{row.waitlistPosition}番目</p>
                )}
                {row.status === "cancelled" && (
                  <p className="cancelled-registration-label">キャンセル済み</p>
                )}
                <ParticipantEventCard event={row.event} />
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">該当する申込はありません。</p>
        ))}
      <section className="section-block my-event-recommendations">
        <h2>参加履歴に関連するイベント</h2>
        <ApiState
          loading={recommendations.loading}
          error={recommendations.error}
          retry={recommendations.reload}
        />
        {recommendations.data?.map((event) => (
          <ParticipantEventCard event={event} key={event.id} />
        ))}
        {recommendations.data?.length === 0 && (
          <p className="empty-state">おすすめイベントはありません。</p>
        )}
      </section>
    </>
  );
}
export function MyEvents() {
  return (
    <RequireLogin>
      <MyEventList />
    </RequireLogin>
  );
}

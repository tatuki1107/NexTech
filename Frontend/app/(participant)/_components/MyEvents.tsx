"use client";
import Link from "next/link";
import { useState } from "react";
import { useApiData } from "../_lib/use-api-data";
import type { ParticipantEvent, Registration } from "../_lib/types";
import { useParticipant } from "./ParticipantProvider";
import { ParticipantEventCard } from "./ParticipantEventCard";
import { RequireLogin } from "./RequireLogin";
import { ApiState } from "./ApiState";
function MyEventList() {
  const [view, setView] = useState("upcoming");
  const { user } = useParticipant();
  const { data, error, loading, reload } = useApiData<Registration[]>(
    `/me/registrations?view=${view}`,
    true,
  );
  const recommendations = useApiData<ParticipantEvent[]>(
    "/me/recommended-events",
    true,
  );
  const rows = data?.filter(
    (row) => view !== "upcoming" || row.status !== "waitlisted",
  );
  return (
    <>
      <div className="profile-summary">
        <div className="avatar">{user?.displayName.slice(0, 1)}</div>
        <div>
          <b>{user?.displayName}</b>
          <p>{user?.email}</p>
        </div>
      </div>
      <div className="segmented-tabs">
        {[
          ["upcoming", "参加予定"],
          ["waitlisted", "キャンセル待ち"],
          ["past", "参加履歴"],
          ["cancelled", "キャンセル済み"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={view === value ? "is-active" : ""}
            onClick={() => setView(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ApiState loading={loading} error={error} retry={reload} />
      {rows &&
        (rows.length ? (
          <div className="my-event-list">
            {rows.map((row) => (
              <div key={row.id}>
                {row.status === "waitlisted" && (
                  <p>キャンセル待ち：現在{row.waitlistPosition}番目</p>
                )}
                {row.status === "cancelled" && <p>キャンセル済み</p>}
                <ParticipantEventCard event={row.event} />
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">該当する申込はありません。</p>
        ))}
      <section className="section-block">
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
          <p>おすすめイベントはありません。</p>
        )}
      </section>
      <Link href="/interests">興味・フォローを管理</Link>
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

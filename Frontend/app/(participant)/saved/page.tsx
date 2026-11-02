"use client";
import { useState } from "react";
import { ParticipantShell } from "../_components/ParticipantShell";
import { RequireLogin } from "../_components/RequireLogin";
import { ParticipantEventCard } from "../_components/ParticipantEventCard";
import { ApiState } from "../_components/ApiState";
import { useApiData } from "../_lib/use-api-data";
import { useParticipant } from "../_components/ParticipantProvider";
import type { ParticipantEvent } from "../_lib/types";
function SavedEvents() {
  const [view, setView] = useState("upcoming");
  const { savedIds } = useParticipant();
  const { data, error, loading, reload } = useApiData<ParticipantEvent[]>(
    `/me/saved-events?view=${view}`,
    true,
  );
  const events = data?.filter((event) => savedIds.includes(event.id));
  return (
    <section className="saved-page">
      <h1>保存済み</h1>
      <div className="segmented-tabs">
        {[
          ["upcoming", "開催予定"],
          ["past", "開催済み"],
        ].map(([value, label]) => (
          <button
            type="button"
            className={view === value ? "is-active" : ""}
            key={value}
            onClick={() => setView(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ApiState loading={loading} error={error} retry={reload} />
      {events &&
        (events.length ? (
          <div className="event-list">
            {events.map((event) => (
              <ParticipantEventCard event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <p className="empty-state">保存済みイベントはありません。</p>
        ))}
    </section>
  );
}
export default function SavedPage() {
  return (
    <ParticipantShell active="saved">
      <RequireLogin>
        <SavedEvents />
      </RequireLogin>
    </ParticipantShell>
  );
}

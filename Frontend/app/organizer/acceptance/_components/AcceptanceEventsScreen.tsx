"use client";
import Link from "next/link";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, PageTitle, CONTROL } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import {
  organizerPath,
  tokyoDate,
  eventView,
  type ManagedEvent,
} from "../../_lib/api";
import EventCard from "../../event-management/_components/EventCard";
import { useState } from "react";
export default function AcceptanceEventsScreen() {
  const { organization } = useOrganizer();
  const { data, error, reload } = useResource<ManagedEvent[]>(
    organizerPath(organization.id) + "/events",
    true,
  );
  const [date, setDate] = useState(tokyoDate());
  const events = data?.filter(
    (event) =>
      event.status === "published" &&
      event.startAt &&
      tokyoDate(new Date(event.startAt)) === date,
  );
  return (
    <div className="space-y-8">
      <PageTitle title="当日受付" />
      <label>
        開催日（日本時間）
        <input
          type="date"
          aria-label="開催日"
          className={CONTROL + " ml-4"}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      {!events ? (
        <ApiState error={error} retry={reload} />
      ) : !events.length ? (
        <p>指定日に開催される公開イベントはありません。</p>
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            event={eventView(event)}
            summary={`参加確定枠 ${event.confirmedCount}名 / 待機 ${event.waitlistCount}名`}
            rate={
              event.capacity
                ? Math.min(
                    100,
                    Math.round((event.confirmedCount / event.capacity) * 100),
                  )
                : 0
            }
            rateLabel="定員に対する申込率"
            actions={
              <Link
                className={CONTROL}
                href={`/organizer/acceptance/${event.id}`}
              >
                受付を開く
              </Link>
            }
          />
        ))
      )}
    </div>
  );
}

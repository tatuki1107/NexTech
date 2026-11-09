"use client";
import Link from "next/link";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, PageTitle, BUTTON } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import { organizerPath, eventView, type ManagedEvent } from "../../_lib/api";
import EventCard from "./EventCard";
import EventManagementActions from "./EventManagementActions";
import { calculateRate } from "../_lib/event";
export default function EventsScreen() {
  const { organization } = useOrganizer();
  const {
    data: events,
    error,
    reload,
  } = useResource<ManagedEvent[]>(
    organizerPath(organization.id) + "/events",
    true,
  );
  return (
    <div className="space-y-8">
      <PageTitle title="イベント管理">
        <Link href="/organizer/event-management/new" className={BUTTON}>
          新規作成
        </Link>
      </PageTitle>
      {!events ? (
        <ApiState error={error} retry={reload} />
      ) : events.length === 0 ? (
        <p>イベントはありません。</p>
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            event={eventView(event)}
            summary={`申込 ${event.confirmedCount} / ${event.capacity ?? "未設定"}名　待機 ${event.waitlistCount}名`}
            rate={calculateRate(event.confirmedCount, event.capacity ?? 0)}
            rateLabel="定員に対する申込率"
            actions={
              <EventManagementActions
                event={eventView(event)}
                onChanged={reload}
              />
            }
          />
        ))
      )}
    </div>
  );
}

import { EventCard } from "./EventCard";
import type { RegistrationEvent } from "../_lib/types";
import { formatEventDate } from "../_lib/event-detail";
export function ParticipantEventCard({ event }: { event: RegistrationEvent }) {
  return (
    <EventCard
      eventId={event.id}
      title={event.title}
      date={formatEventDate(event.startAt, event.endAt)}
      format={event.format}
      venueName={event.venueName}
      category={event.category?.name ?? "カテゴリ未設定"}
      organizer={event.organizer.name}
      seatsLeft={event.capacity === null ? undefined : Math.max(0, event.capacity - event.confirmedCount)}
    />
  );
}

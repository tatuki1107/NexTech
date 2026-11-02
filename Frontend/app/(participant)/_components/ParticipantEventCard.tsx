import { EventCard } from "./EventCard";
import type { ParticipantEvent } from "../_lib/types";
import { formatEventDate } from "../_lib/event-detail";
export function ParticipantEventCard({ event }: { event: ParticipantEvent }) {
  return (
    <EventCard
      eventId={event.id}
      title={event.title}
      date={formatEventDate(event.startAt, event.endAt)}
      location={
        event.format === "online"
          ? "オンライン"
          : (event.venueName ?? "会場未定")
      }
      category={event.category.name}
      organizer={event.organizer.name}
      seatsLeft={Math.max(0, event.capacity - event.confirmedCount)}
    />
  );
}

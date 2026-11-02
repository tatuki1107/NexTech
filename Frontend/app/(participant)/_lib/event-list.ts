import { getAll } from "./api";
import type { ParticipantEvent } from "./types";
export async function getPublicEvents(signal?: AbortSignal) {
  const events = await getAll<ParticipantEvent>("/events", signal);
  return events.map((event) => ({
    ...event,
    categoryName: event.category.name,
    organizerName: event.organizer.name,
    tagNames: event.tags.map((tag) => tag.name),
    applicationDeadline: event.applicationDeadline ?? null,
    seatsLeft: Math.max(0, event.capacity - event.confirmedCount),
  }));
}

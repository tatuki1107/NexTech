import { readCalendarDate } from "../../../_lib/calendar-date";

export function isEventOnAcceptanceDate(
  event: { status: string; startAt: string | null; endAt: string | null },
  date: string,
) {
  if (event.status !== "published" || !event.startAt || !event.endAt || !readCalendarDate(date)) return false;
  const dayStart = Date.parse(`${date}T00:00:00+09:00`);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const start = Date.parse(event.startAt);
  const end = Date.parse(event.endAt);
  return start < end && start < dayEnd && end > dayStart;
}

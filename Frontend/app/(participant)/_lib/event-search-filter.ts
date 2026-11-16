import { matchesEventFormat, type EventFormatFilter } from "./event-format";
import { tokyoDate } from "../../_lib/calendar-date";

export function matchesDateFilter(eventDate: Date, filter: string) {
  if (filter === "すべて") return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
    return tokyoDate(eventDate) === filter;
  }
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  if (filter === "今月")
    return (
      eventDate.getFullYear() === now.getFullYear() &&
      eventDate.getMonth() === now.getMonth()
    );
  if (filter === "今週") {
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
    return eventDate >= startOfToday && eventDate < endOfWeek;
  }
  return `${eventDate.getMonth() + 1}/${eventDate.getDate()}` === filter;
}

export type SearchableEvent = {
  title: string;
  categoryName: string;
  organizerName: string;
  tagNames?: string[];
  startAt: string;
  format: string;
};
export type EventFilters = {
  keyword: string;
  date: string;
  dateFrom?: string;
  dateTo?: string;
  tags: string[];
  format: EventFormatFilter;
};

function matchesEventDate(startAt: string, { date, dateFrom, dateTo }: EventFilters) {
  const start = new Date(startAt);
  if (!dateFrom && !dateTo) return matchesDateFilter(start, date);
  const day = tokyoDate(start);
  return Boolean(day) && (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
}

export function matchesEventFilters(
  event: SearchableEvent,
  filters: EventFilters,
): boolean {
  const text =
    `${event.title} ${event.categoryName} ${event.organizerName} ${(event.tagNames ?? []).join(" ")}`.toLowerCase();
  return (
    text.includes(filters.keyword.trim().toLowerCase()) &&
    (filters.tags.length === 0 ||
      [event.categoryName, ...(event.tagNames ?? [])].some((tag) =>
        filters.tags.includes(tag),
      )) &&
    matchesEventFormat(event.format, filters.format) &&
    matchesEventDate(event.startAt, filters)
  );
}

import { matchesEventFormat, type EventFormatFilter } from "./event-format";
import { tokyoDate } from "../../_lib/calendar-date";

export function quickDateLabel(day: string) {
  return day ? `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}` : "";
}

export function matchesDateFilter(eventDate: Date, filter: string, now = new Date()) {
  if (filter === "すべて") return true;
  const day = tokyoDate(eventDate);
  if (!day) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
    return day === filter;
  }
  const today = tokyoDate(now);
  if (filter === "今月")
    return day.slice(0, 7) === today.slice(0, 7);
  if (filter === "今週") {
    const endOfWeek = new Date(today);
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + (7 - endOfWeek.getUTCDay()));
    return day >= today && day < endOfWeek.toISOString().slice(0, 10);
  }
  return quickDateLabel(day) === filter;
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

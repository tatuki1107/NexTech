import { parseEventFormatFilter } from "./event-format";
import type { EventFilters } from "./event-search-filter";
import { readCalendarDate } from "../../_lib/calendar-date";

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  keyword: "",
  date: "すべて",
  dateFrom: "",
  dateTo: "",
  tags: [],
  format: "all",
};

export function readEventSearchQuery(params: Pick<URLSearchParams, "get">): EventFilters {
  const dateFrom = readCalendarDate(params.get("from"));
  const dateTo = readCalendarDate(params.get("to"));
  return {
    keyword: params.get("keyword") ?? DEFAULT_EVENT_FILTERS.keyword,
    date: dateFrom || dateTo ? DEFAULT_EVENT_FILTERS.date : params.get("date") || DEFAULT_EVENT_FILTERS.date,
    dateFrom,
    dateTo,
    tags: [...new Set(params.get("tags")?.split(",").filter(Boolean))],
    format: parseEventFormatFilter(params.get("format")),
  };
}

export function updateEventSearchQuery(params: URLSearchParams, changes: Partial<EventFilters>, persistAll = false) {
  const next = new URLSearchParams(params);
  const queryValues = {
    keyword: changes.keyword?.trim(),
    date: changes.date === DEFAULT_EVENT_FILTERS.date ? "" : changes.date,
    tags: changes.tags?.join(","),
    format: changes.format === DEFAULT_EVENT_FILTERS.format ? "" : changes.format,
    from: changes.dateFrom,
    to: changes.dateTo,
  };

  // Only synchronize URL-backed filters; ordinary in-page searches need not enter the address bar.
  for (const [key, value] of Object.entries(queryValues)) {
    if (value === undefined || (!persistAll && !params.has(key) && key !== "from" && key !== "to")) continue;
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
}

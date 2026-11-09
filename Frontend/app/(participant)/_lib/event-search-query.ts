import { parseEventFormatFilter } from "./event-format";
import type { EventFilters } from "./event-search-filter";

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  keyword: "",
  date: "すべて",
  tags: [],
  format: "all",
};

export function readEventSearchQuery(params: Pick<URLSearchParams, "get">): EventFilters {
  return {
    keyword: params.get("keyword") ?? DEFAULT_EVENT_FILTERS.keyword,
    date: params.get("date") || DEFAULT_EVENT_FILTERS.date,
    tags: [...new Set(params.get("tags")?.split(",").filter(Boolean))],
    format: parseEventFormatFilter(params.get("format")),
  };
}

export function updateEventSearchQuery(params: URLSearchParams, changes: Partial<EventFilters>) {
  const next = new URLSearchParams(params);
  const queryValues = {
    keyword: changes.keyword?.trim(),
    date: changes.date === DEFAULT_EVENT_FILTERS.date ? "" : changes.date,
    tags: changes.tags?.join(","),
    format: changes.format === DEFAULT_EVENT_FILTERS.format ? "" : changes.format,
  };

  // Only synchronize URL-backed filters; ordinary in-page searches need not enter the address bar.
  for (const [key, value] of Object.entries(queryValues)) {
    if (value === undefined || !params.has(key)) continue;
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
}

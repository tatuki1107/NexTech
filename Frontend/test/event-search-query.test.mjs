import { expect, test } from "bun:test";
import {
  DEFAULT_EVENT_FILTERS,
  readEventSearchQuery,
  updateEventSearchQuery,
} from "../app/(participant)/_lib/event-search-query";

const filters = { keyword: "workshop", date: "2026-11-09", tags: ["Docker", "Bun"], format: "hybrid" };
const initial = new URLSearchParams({
  ...filters,
  tags: filters.tags.join(","),
  source: "test",
});

function reload(changes) {
  const next = updateEventSearchQuery(initial, changes);
  return { params: next, filters: readEventSearchQuery(new URLSearchParams(next.toString())) };
}

test("removing a URL-backed tag persists on reload and leaves the other tag and filters", () => {
  expect(reload({ tags: ["Bun"] }).filters).toEqual({ ...filters, tags: ["Bun"] });
  const removedLast = reload({ tags: [] });
  expect(removedLast.params.has("tags")).toBe(false);
  expect(removedLast.filters).toEqual({ ...filters, tags: [] });
});

test("removing keyword, date or format persists independently on reload", () => {
  for (const key of ["keyword", "date", "format"]) {
    const change = { [key]: DEFAULT_EVENT_FILTERS[key] };
    const result = reload(change);
    expect(result.params.has(key)).toBe(false);
    expect(result.filters).toEqual({ ...filters, ...change });
  }
});

test("clearing all filters persists on reload without removing unrelated parameters", () => {
  const result = reload(DEFAULT_EVENT_FILTERS);
  expect(result.params.toString()).toBe("source=test");
  expect(result.filters).toEqual(DEFAULT_EVENT_FILTERS);
});

test("applying a replacement updates existing URL filters without adding in-page-only filters", () => {
  const result = updateEventSearchQuery(new URLSearchParams("tags=Docker"), {
    tags: ["Bun"],
    keyword: "workshop",
  });
  expect(result.toString()).toBe("tags=Bun");
});

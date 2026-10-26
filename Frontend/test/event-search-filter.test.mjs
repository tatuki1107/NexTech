import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesDateFilter, matchesEventFilters } from "../app/(participant)/_lib/event-search-filter.ts";

const events = [
  { title: "React", categoryName: "Frontend", organizerName: "Team", startAt: "2026-11-01T13:00:00+09:00", format: "online" },
  { title: "SQL", categoryName: "Backend", organizerName: "Team", startAt: "2026-11-02T13:00:00+09:00", format: "offline" },
];
const all = { keyword: "", date: "すべて", tags: [], format: "すべて" };

test("specific date filters by year, month and day", () => {
  assert.equal(matchesDateFilter(new Date(2026, 10, 1, 13), "2026-11-01"), true);
  assert.equal(matchesDateFilter(new Date(2027, 10, 1, 13), "2026-11-01"), false);
  assert.equal(matchesDateFilter(new Date(2026, 10, 2, 13), "2026-11-01"), false);
  assert.equal(matchesDateFilter(new Date(2026, 10, 1, 13), ""), false);
});
test("replacing URL-initialized filters does not retain hidden constraints", () => {
  const initial = { ...all, tags: ["Frontend"], format: "オンライン" };
  assert.deepEqual(events.filter(event => matchesEventFilters(event, initial)), [events[0]]);
  const applied = { ...all, tags: ["Backend"], format: "会場開催" };
  assert.deepEqual(events.filter(event => matchesEventFilters(event, applied)), [events[1]]);
  assert.equal(events.filter(event => matchesEventFilters(event, all)).length, 2);
});
test("preview and list use the same keyword, date, tags and format predicate", () => {
  const filters = { ...all, keyword: " SQL ", date: "2026-11-02", tags: ["Backend"], format: "会場開催" };
  const preview = events.filter(event => matchesEventFilters(event, filters)).length;
  const list = events.filter(event => matchesEventFilters(event, filters));
  assert.equal(preview, list.length);
  assert.equal(preview, 1);
});

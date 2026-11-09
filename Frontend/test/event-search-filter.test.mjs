import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesDateFilter, matchesEventFilters } from "../app/(participant)/_lib/event-search-filter.ts";

const events = [
  { title: "React", categoryName: "Frontend", organizerName: "Team", startAt: "2026-11-01T13:00:00+09:00", format: "online" },
  { title: "SQL", categoryName: "Backend", organizerName: "Team", startAt: "2026-11-02T13:00:00+09:00", format: "offline" },
];
const all = { keyword: "", date: "すべて", tags: [], format: "all" };

test("specific date filters by year, month and day", () => {
  assert.equal(matchesDateFilter(new Date(2026, 10, 1, 13), "2026-11-01"), true);
  assert.equal(matchesDateFilter(new Date(2027, 10, 1, 13), "2026-11-01"), false);
  assert.equal(matchesDateFilter(new Date(2026, 10, 2, 13), "2026-11-01"), false);
  assert.equal(matchesDateFilter(new Date(2026, 10, 1, 13), ""), false);
});
test("API tag names participate in search and filtering independently of categories", () => {
  const tagged = { ...events[0], tagNames: ["TypeScript"] };
  assert.equal(matchesEventFilters(tagged, { ...all, tags: ["TypeScript"] }), true);
  assert.equal(matchesEventFilters(tagged, { ...all, keyword: "typescript" }), true);
});
test("replacing URL-initialized filters does not retain hidden constraints", () => {
  const initial = { ...all, tags: ["Frontend"], format: "online" };
  assert.deepEqual(events.filter(event => matchesEventFilters(event, initial)), [events[0]]);
  const applied = { ...all, tags: ["Backend"], format: "offline" };
  assert.deepEqual(events.filter(event => matchesEventFilters(event, applied)), [events[1]]);
  assert.equal(events.filter(event => matchesEventFilters(event, all)).length, 2);
});
test("preview and list use the same keyword, date, tags and format predicate", () => {
  const filters = { ...all, keyword: " SQL ", date: "2026-11-02", tags: ["Backend"], format: "offline" };
  const preview = events.filter(event => matchesEventFilters(event, filters)).length;
  const list = events.filter(event => matchesEventFilters(event, filters));
  assert.equal(preview, list.length);
  assert.equal(preview, 1);
});
test("venue, online and hybrid are disjoint and clearing format preserves tags", () => {
  const hybrid = { ...events[1], title: "Docker", format: "hybrid" };
  const fixtures = [...events, hybrid];
  for (const event of fixtures) {
    assert.deepEqual(
      fixtures.filter((candidate) => matchesEventFilters(candidate, { ...all, format: event.format })),
      [event],
    );
  }
  assert.deepEqual(
    fixtures.filter((event) => matchesEventFilters(event, { ...all, tags: ["Backend"] })),
    [events[1], hybrid],
  );
});

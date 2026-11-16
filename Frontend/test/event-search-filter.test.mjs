import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesDateFilter, matchesEventFilters, quickDateLabel } from "../app/(participant)/_lib/event-search-filter.ts";
import { formatEventDate } from "../app/(participant)/_lib/event-detail.ts";
import { tokyoDate } from "../app/_lib/calendar-date.ts";

const events = [
  { title: "React", categoryName: "Frontend", organizerName: "Team", startAt: "2026-11-01T13:00:00+09:00", format: "online" },
  { title: "SQL", categoryName: "Backend", organizerName: "Team", startAt: "2026-11-02T13:00:00+09:00", format: "offline" },
];
const all = { keyword: "", date: "すべて", tags: [], format: "all" };

test("specific date filters by year, month and day", () => {
  assert.equal(matchesDateFilter(new Date("2026-11-01T13:00:00+09:00"), "2026-11-01"), true);
  assert.equal(matchesDateFilter(new Date("2027-11-01T13:00:00+09:00"), "2026-11-01"), false);
  assert.equal(matchesDateFilter(new Date("2026-11-02T13:00:00+09:00"), "2026-11-01"), false);
  assert.equal(matchesDateFilter(new Date("2026-11-01T13:00:00+09:00"), ""), false);
});
test("range bounds are inclusive and use the event's Tokyo start date", () => {
  const beforeMidnight = { ...events[0], startAt: "2026-11-01T14:59:59Z" };
  const midnight = { ...events[0], startAt: "2026-11-01T15:00:00Z" };
  assert.equal(matchesEventFilters(beforeMidnight, { ...all, dateFrom: "2026-11-02" }), false);
  assert.equal(matchesEventFilters(midnight, { ...all, dateFrom: "2026-11-02", dateTo: "2026-11-02" }), true);
  assert.equal(matchesEventFilters(midnight, { ...all, dateTo: "2026-11-01" }), false);
  assert.equal(matchesEventFilters(beforeMidnight, { ...all, dateTo: "2026-11-01" }), true);
});
test("display, quick dates and relative search filters use Tokyo across month and week boundaries", () => {
  const midnight = new Date("2026-01-31T15:00:00Z");
  const saturday = new Date("2026-01-31T14:59:59Z");
  assert.equal(quickDateLabel(tokyoDate(midnight)), "2/1");
  assert.equal(matchesDateFilter(midnight, "2/1"), true);
  assert.equal(matchesDateFilter(saturday, "2/1"), false);
  assert.equal(matchesDateFilter(midnight, "今月", midnight), true);
  assert.equal(matchesDateFilter(saturday, "今月", midnight), false);
  assert.equal(matchesDateFilter(midnight, "今週", saturday), false);
  assert.equal(matchesDateFilter(midnight, "今週", midnight), true);
  const label = formatEventDate(midnight.toISOString(), "2026-01-31T16:00:00Z");
  assert.match(label, /2\/1.*00:00.*01:00/);
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

import { test } from "node:test";
import assert from "node:assert/strict";
import { isEventOnAcceptanceDate } from "../app/organizer/acceptance/_lib/acceptance-date.ts";

test("multi-day events appear on each overlapping Tokyo date, excluding the midnight end boundary", () => {
  const event = { status: "published", startAt: "2026-11-15T16:00:00Z", endAt: "2026-11-17T15:00:00Z" };
  assert.equal(isEventOnAcceptanceDate(event, "2026-11-15"), false);
  assert.equal(isEventOnAcceptanceDate(event, "2026-11-16"), true);
  assert.equal(isEventOnAcceptanceDate(event, "2026-11-17"), true);
  assert.equal(isEventOnAcceptanceDate(event, "2026-11-18"), false);
  assert.equal(isEventOnAcceptanceDate({ ...event, status: "draft" }, "2026-11-17"), false);
  assert.equal(isEventOnAcceptanceDate({ ...event, endAt: null }, "2026-11-17"), false);
});

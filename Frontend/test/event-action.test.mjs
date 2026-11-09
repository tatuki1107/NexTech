import { test } from "node:test";
import assert from "node:assert/strict";
import { getEventActionPolicy } from "../app/(participant)/_lib/event-action.ts";
const now = Date.parse("2026-11-02T00:00:00Z");
const event = { startAt: "2099-01-01T00:00:00Z", applicationDeadline: null, seatsLeft: 0, waitlistEnabled: true, isArchived: true };

test("participants can cancel paused/unpublished future registrations", () => {
  for (const registrationStatus of ["pending", "confirmed", "waitlisted"]) {
    assert.deepEqual(getEventActionPolicy({ ...event, registrationStatus }, now), { kind: "cancel", disabledReason: undefined });
  }
});
test("unpublished details never offer a new or repeat application", () => {
  for (const registrationStatus of [null, "cancelled", "checked_in", "no_show"]) {
    assert.equal(getEventActionPolicy({ ...event, registrationStatus }, now).kind, "history");
  }
});
test("a cleared schedule uses the previous start to decide whether cancellation is available", () => {
  const registration = { ...event, startAt: null, registrationStatus: "confirmed" };
  assert.equal(getEventActionPolicy({ ...registration, effectiveStartAt: event.startAt }, now).kind, "cancel");
  assert.equal(getEventActionPolicy({ ...registration, effectiveStartAt: "2000-01-01T10:00:00Z" }, now).kind, "history");
  assert.equal(getEventActionPolicy({ ...registration, effectiveStartAt: null }, now).kind, "history");
});
test("past unpublished registrations remain read-only", () => {
  assert.equal(getEventActionPolicy({ ...event, startAt: "2020-01-01T00:00:00Z", registrationStatus: "confirmed" }, now).kind, "history");
});
test("published registration actions respect check-in, start and waitlist restrictions", () => {
  const published = { ...event, isArchived: false };
  assert.equal(getEventActionPolicy({ ...published, registrationStatus: "checked_in" }, now).disabledReason, "この申込はキャンセルできません");
  assert.equal(getEventActionPolicy({ ...published, registrationStatus: "confirmed", startAt: "2020-01-01T00:00:00Z" }, now).disabledReason, "開催後はキャンセルできません");
  assert.equal(getEventActionPolicy({ ...published, registrationStatus: null }, now).disabledReason, undefined);
  assert.equal(getEventActionPolicy({ ...published, registrationStatus: null, waitlistEnabled: false }, now).disabledReason, "満席です");
});

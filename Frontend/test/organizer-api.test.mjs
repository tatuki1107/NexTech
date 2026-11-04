import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isOrganizerEndpoint,
  proxyParticipantApi,
} from "../app/_lib/api-proxy.ts";
import {
  EMPTY_EVENT_FORM,
  eventPayload,
  eventFormValues,
} from "../app/organizer/event-management/_lib/event-form.ts";
import {
  eventView,
  tokyoDate,
  registrationLabels,
  csvContent,
} from "../app/organizer/_lib/api.ts";
const id = "11111111-1111-4111-8111-111111111111";
test("CSV quotes delimiters and neutralizes spreadsheet formulas including leading whitespace", () => {
  const csv = csvContent([["a,b", 'a"b', "=1+1", "  =SUM(1)", "line\nnext"]]);
  assert.equal(csv, '\uFEFF"a,b","a""b","\'=1+1","\'  =SUM(1)","line\nnext"');
});
test("organizer proxy only permits scoped application endpoints and still enforces CSRF", async () => {
  for (const [path, method] of [
    [`organizers/${id}/events`, "POST"],
    [`events/${id}`, "PATCH"],
    [`events/${id}/registrations/${id}/check-in`, "DELETE"],
    [`organizers/${id}/analytics`, "GET"],
  ])
    assert.equal(isOrganizerEndpoint(path, method), true);
  for (const path of [
    "admin/events",
    "../organizers",
    "auth/refresh",
    `events/${id}/registrations/${id}/status`,
  ])
    assert.equal(isOrganizerEndpoint(path, "PATCH"), false);
  const request = new Request(`http://localhost/api/v1/events/${id}`, {
    method: "PATCH",
    headers: { origin: "https://evil.test" },
  });
  assert.equal(
    (
      await proxyParticipantApi(
        request,
        ["events", id],
        () => {
          throw Error("must not fetch");
        },
        true,
      )
    ).status,
    403,
  );
});
test("event forms serialize title-only drafts without fabricating required fields", () => {
  const payload = eventPayload({ ...EMPTY_EVENT_FORM, title: " Draft " });
  assert.equal(payload.title, "Draft");
  assert.equal(payload.capacity, null);
  assert.equal(payload.categoryId, null);
  assert.equal(payload.startAt, null);
  assert.equal(payload.format, null);
});
test("Tokyo dates, multi-day events and explicit clear requests round trip correctly", () => {
  const event = {
    ...EMPTY_EVENT_FORM,
    title: "Test",
    date: "2099-01-01",
    startTime: "23:30",
    endDate: "2099-01-02",
    endTime: "01:30",
    capacity: "5",
    tags: [id],
  };
  const payload = eventPayload(event);
  assert.equal(payload.startAt, "2099-01-01T14:30:00.000Z");
  assert.equal(payload.endAt, "2099-01-01T16:30:00.000Z");
  assert.deepEqual(payload.tagIds, [id]);
  assert.equal(payload.onlineUrl, null);
  assert.equal(payload.applicationDeadline, null);
  const values = eventFormValues({
    title: "Test",
    description: "",
    tags: [],
    startAt: payload.startAt,
    endAt: payload.endAt,
    capacity: 5,
    waitlistEnabled: false,
  });
  assert.equal(values.endDate, "2099-01-02");
  assert.equal(values.startTime, "23:30");
  assert.equal(tokyoDate(new Date("2098-12-31T15:00:00Z")), "2099-01-01");
});
test("form validation rejects inverted ranges and fractional capacities", () => {
  assert.throws(() =>
    eventPayload({ ...EMPTY_EVENT_FORM, title: "Test", capacity: "1.5" }),
  );
  assert.throws(() =>
    eventPayload({
      ...EMPTY_EVENT_FORM,
      title: "Test",
      date: "2099-01-01",
      startTime: "13:00",
      endDate: "2099-01-01",
      endTime: "12:00",
    }),
  );
});
test("API event and registration statuses retain their meanings in the UI", () => {
  assert.equal(
    eventView({ status: "cancelled", tags: [], confirmedCount: 0 }).status,
    "cancelled",
  );
  assert.equal(
    eventView({ status: "completed", tags: [], confirmedCount: 0 }).status,
    "ended",
  );
  assert.equal(registrationLabels.pending, "確認待ち");
  assert.equal(registrationLabels.checked_in, "受付済");
  assert.equal(registrationLabels.no_show, "欠席");
});

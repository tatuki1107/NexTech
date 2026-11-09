import { expect, test } from "bun:test";
import { mergeRegistrationHistory } from "../app/(participant)/_lib/registration-history";

test("history includes future cancellations and does not repeat past cancellations", () => {
  const attended = { id: "attended", status: "checked_in", event: { startAt: "2026-10-03" } };
  const cancelledPast = { id: "old", status: "cancelled", event: { startAt: "2026-09-01" } };
  const cancelledFuture = { id: "future", status: "cancelled", effectiveStartAt: "2026-12-01", event: { startAt: null } };
  const unscheduled = { id: "unscheduled", status: "cancelled", event: { startAt: null } };
  expect(mergeRegistrationHistory(
    [attended, cancelledPast],
    [cancelledFuture, cancelledPast, unscheduled],
  )).toEqual([cancelledFuture, attended, cancelledPast, unscheduled]);
});

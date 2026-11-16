import { test } from "node:test";
import assert from "node:assert/strict";
import { getFilters } from "../app/admin/_lib/filters.ts";
import { SECTIONS, actionLabel } from "../app/admin/_lib/records.ts";
import { historySummary } from "../app/admin/_lib/change-history.ts";

test("suspended organizers can be filtered and appear as suspended in the audit trail", () => {
  assert.equal(SECTIONS.organizers.statuses.suspended, "停止中");
  assert.equal(getFilters("organizers", { status: "suspended" }), "status=suspended");
  assert.equal(actionLabel({ targetType: "organizer", action: "suspended" }), "停止中");
});

test("event history identifies address-only and streaming-URL-only edits", () => {
  const row = { id: "fixture", actorUserId: null, createdAt: "2026-11-16T00:00:00Z", changeType: "updated" };
  assert.equal(historySummary("events", {
    ...row, beforeData: { address: "旧住所" }, afterData: { address: "新住所" },
  }), "住所");
  assert.equal(historySummary("events", {
    ...row, beforeData: JSON.stringify({ online_url: "https://example.test/old" }),
    afterData: { onlineUrl: "https://example.test/new" },
  }), "配信URL");
  assert.equal(historySummary("events", {
    ...row, beforeData: { online_url: null }, afterData: { onlineUrl: null },
  }), "");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { getFilters } from "../app/admin/_lib/filters.ts";
import { SECTIONS, actionLabel } from "../app/admin/_lib/records.ts";

test("suspended organizers can be filtered and appear as suspended in the audit trail", () => {
  assert.equal(SECTIONS.organizers.statuses.suspended, "停止中");
  assert.equal(getFilters("organizers", { status: "suspended" }), "status=suspended");
  assert.equal(actionLabel({ targetType: "organizer", action: "suspended" }), "停止中");
});

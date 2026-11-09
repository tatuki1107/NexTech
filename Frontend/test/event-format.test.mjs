import { expect, test } from "bun:test";
import { getEventFormatLabel, parseEventFormatFilter } from "../app/(participant)/_lib/event-format";

test("event cards distinguish venue, online, and hybrid formats", () => {
  expect(getEventFormatLabel("offline")).toBe("会場");
  expect(getEventFormatLabel("online")).toBe("オンライン");
  expect(getEventFormatLabel("hybrid")).toBe("ハイブリッド");
});

test("a missing or unsupported format is not presented as a known format", () => {
  expect(getEventFormatLabel(null)).toBeNull();
  expect(getEventFormatLabel("unknown")).toBeNull();
});

test("format links accept API values and existing Japanese values", () => {
  expect(parseEventFormatFilter("hybrid")).toBe("hybrid");
  expect(parseEventFormatFilter("ハイブリッド")).toBe("hybrid");
  expect(parseEventFormatFilter("会場開催")).toBe("offline");
  expect(parseEventFormatFilter("オンライン")).toBe("online");
  expect(parseEventFormatFilter("invalid")).toBe("all");
});

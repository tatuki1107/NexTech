import { describe, expect, test } from "bun:test";
import { ApiError, toErrorResponse } from "../src/lib/errors";
import { assertRateLimit } from "../src/lib/rate-limit";
import { assertEventTimes, pagination } from "../src/lib/validation";
import { createAccessToken, verifyAccessToken } from "../src/lib/auth";

describe("pagination", () => {
  test("uses defaults", () => expect(pagination()).toEqual({ page: 1, perPage: 20, offset: 0 }));
  test("calculates offset", () => expect(pagination(3, 25)).toEqual({ page: 3, perPage: 25, offset: 50 }));
  test("rejects invalid values", () => expect(() => pagination(0, 101)).toThrow(ApiError));
});

describe("event time rules", () => {
  test("accepts a valid period", () => expect(() => assertEventTimes("2030-01-02T10:00:00Z", "2030-01-02T12:00:00Z", "2030-01-01T10:00:00Z")).not.toThrow());
  test("rejects an end before start", () => expect(() => assertEventTimes("2030-01-02T12:00:00Z", "2030-01-02T10:00:00Z", "2030-01-01T10:00:00Z")).toThrow(ApiError));
});

test("error response does not expose stack traces", () => {
  const response = toErrorResponse(new ApiError(404, "NOT_FOUND", "missing"));
  expect(response).toEqual({ error: { code: "NOT_FOUND", message: "missing" } });
  expect(JSON.stringify(response)).not.toContain("stack");
});

test("rate limiter rejects excess requests", () => {
  assertRateLimit("unit-test", 1, 60_000);
  expect(() => assertRateLimit("unit-test", 1, 60_000)).toThrow(ApiError);
});

test("access token verifies signature and audience", async () => {
  const userId = crypto.randomUUID();
  const token = await createAccessToken(userId);
  expect((await verifyAccessToken(token)).sub).toBe(userId);
  const [header, payload, signature] = token.split(".") as [string, string, string];
  const tamperedSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  await expect(verifyAccessToken(`${header}.${payload}.${tamperedSignature}`)).rejects.toThrow(ApiError);
});

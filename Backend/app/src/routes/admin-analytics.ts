import { Elysia, t } from "elysia";
import { getCurrentUser, requireRole } from "../lib/auth";
import { UUID_PATTERN } from "../lib/validation";
import { monthlyAnalytics, groupedAnalytics } from "../services/analytics";

const filters = {
  from: t.String({ format: "date" }),
  to: t.String({ format: "date" }),
  organizerId: t.Optional(t.String({ pattern: UUID_PATTERN })),
  categoryId: t.Optional(t.String({ pattern: UUID_PATTERN })),
  format: t.Optional(
    t.Union([t.Literal("online"), t.Literal("offline"), t.Literal("hybrid")]),
  ),
};
const ranking = {
  ...filters,
  metric: t.Optional(
    t.Union([
      t.Literal("events"),
      t.Literal("registrations"),
      t.Literal("attendance"),
      t.Literal("applicationRate"),
    ]),
  ),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 })),
};
const authorize = async (header?: string) => {
  requireRole((await getCurrentUser(header))!, "admin");
};
export const adminAnalyticsRoutes = new Elysia({ prefix: "/admin/analytics" })
  .get(
    "/monthly-events",
    async ({ headers, query }) => {
      await authorize(headers.authorization);
      return {
        data: (await monthlyAnalytics(query)).map((row) => ({
          month: row.month,
          eventCount: row.eventCount,
        })),
      };
    },
    { query: t.Object(filters) },
  )
  .get(
    "/monthly-participants",
    async ({ headers, query }) => {
      await authorize(headers.authorization);
      return { data: await monthlyAnalytics(query) };
    },
    { query: t.Object(filters) },
  )
  .get(
    "/popular-categories",
    async ({ headers, query }) => {
      await authorize(headers.authorization);
      return {
        data: await groupedAnalytics(
          query,
          "category",
          query.metric ?? "registrations",
          query.limit ?? 10,
        ),
      };
    },
    { query: t.Object(ranking) },
  )
  .get(
    "/popular-organizers",
    async ({ headers, query }) => {
      await authorize(headers.authorization);
      return {
        data: await groupedAnalytics(
          query,
          "organizer",
          query.metric ?? "registrations",
          query.limit ?? 10,
        ),
      };
    },
    { query: t.Object(ranking) },
  )
  .get(
    "/breakdown",
    async ({ headers, query }) => {
      await authorize(headers.authorization);
      return {
        data: await groupedAnalytics(
          query,
          query.groupBy,
          query.metric ?? "events",
          query.limit ?? 100,
        ),
      };
    },
    {
      query: t.Object({
        ...ranking,
        groupBy: t.Union([
          t.Literal("category"),
          t.Literal("organizer"),
          t.Literal("format"),
        ]),
      }),
    },
  );

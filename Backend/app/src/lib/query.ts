import { t } from "elysia";
import { sqlClient } from "../db";
import { ApiError } from "./errors";
import { pagination } from "./validation";

export const listQuery = { page: t.Optional(t.Numeric()), perPage: t.Optional(t.Numeric()), keyword: t.Optional(t.String({ maxLength: 200 })), from: t.Optional(t.String({ format: "date" })), to: t.Optional(t.String({ format: "date" })) };
export type ListQuery = { page?: number; perPage?: number; keyword?: string; from?: string; to?: string };
export const assertDateRange = (from?: string, to?: string): void => {
  if (from && to && from > to) throw new ApiError(400, "VALIDATION_ERROR", "期間が不正です");
};
export const listSql = async (select: string, from: string, values: unknown[], query: ListQuery, order: string) => {
  const { page, perPage, offset } = pagination(query.page, query.perPage);
  const [count] = await sqlClient.unsafe(`SELECT count(*)::int AS total ${from}`, values);
  const data = await sqlClient.unsafe(`${select} ${from} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, perPage, offset]);
  return { data, pagination: { page, perPage, total: Number(count.total) } };
};

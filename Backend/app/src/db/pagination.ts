import { sqlClient } from "./index";
import type { pagination } from "../lib/validation";

type Page = ReturnType<typeof pagination>;
type PageResult = {
  data: Record<string, unknown>[];
  pagination: { page: number; perPage: number; total: number };
};

// The supplied SELECT includes count(*) OVER() AS total, but no LIMIT/OFFSET.
// Empty pages have no window-count row, so count the same filtered query separately.
export const queryPage = async (
  query: string,
  values: unknown[],
  page: Page,
): Promise<PageResult> => {
  const rows = await sqlClient.unsafe(
    `${query} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, page.perPage, page.offset],
  );
  let total = Number(rows[0]?.total ?? 0);
  if (!rows.length) {
    const [count] = await sqlClient.unsafe(
      `SELECT count(*)::int AS total FROM (${query}) AS matching_rows`,
      values,
    );
    total = Number(count.total);
  }
  return {
    data: rows.map((row: Record<string, unknown>) => {
      const { total: _total, ...item } = row;
      return item;
    }),
    pagination: { page: page.page, perPage: page.perPage, total },
  };
};

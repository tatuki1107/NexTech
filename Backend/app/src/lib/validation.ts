import { ApiError } from "./errors";

export const UUID_PATTERN =
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$";
export const SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
export const escapeLike = (value: string): string =>
  value.replace(/[\\%_]/g, "\\$&");

export const assertDateRange = (from: string, to: string): void => {
  const start = new Date(`${from}T00:00:00Z`),
    end = new Date(`${to}T00:00:00Z`);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    from !== start.toISOString().slice(0, 10) ||
    to !== end.toISOString().slice(0, 10) ||
    start > end ||
    end.getTime() - start.getTime() > 3660 * 86400000
  ) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "期間は有効な日付で10年以内を指定してください",
    );
  }
};

export const pagination = (
  pageValue?: string | number,
  perPageValue?: string | number,
) => {
  const page = Number(pageValue ?? 1);
  const perPage = Number(perPageValue ?? 20);
  const offset = (page - 1) * perPage;
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isInteger(perPage) ||
    perPage < 1 ||
    perPage > 100 ||
    !Number.isSafeInteger(offset)
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", "ページ指定が不正です");
  }
  return { page, perPage, offset };
};

export const assertEventTimes = (
  startAt: string,
  endAt: string,
  deadline: string | null,
): void => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const close = deadline ? new Date(deadline) : null;
  if (
    [start, end, ...(close ? [close] : [])].some((date) =>
      Number.isNaN(date.getTime()),
    ) ||
    start >= end ||
    (close && close > start)
  ) {
    throw new ApiError(
      422,
      "BUSINESS_RULE_ERROR",
      "開催日時または申込期限が不正です",
    );
  }
};

import { ApiError } from "./errors";

export const UUID_PATTERN = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$";
export const SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

export const pagination = (pageValue?: string | number, perPageValue?: string | number) => {
  const page = Number(pageValue ?? 1);
  const perPage = Number(perPageValue ?? 20);
  const offset = (page - 1) * perPage;
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > 100 || !Number.isSafeInteger(offset)) {
    throw new ApiError(400, "VALIDATION_ERROR", "ページ指定が不正です");
  }
  return { page, perPage, offset };
};

export const assertEventTimes = (startAt: string, endAt: string, deadline: string | null): void => {
  const start = new Date(startAt); const end = new Date(endAt); const close = deadline ? new Date(deadline) : null;
  if ([start, end, ...(close ? [close] : [])].some((date) => Number.isNaN(date.getTime())) || start >= end || (close && close > start)) {
    throw new ApiError(422, "BUSINESS_RULE_ERROR", "開催日時または申込期限が不正です");
  }
};

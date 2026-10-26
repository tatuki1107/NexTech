import { ApiError } from "../lib/errors";

// Accept partially filled drafts, but validate every relationship that is present.
export function validateEventContent(event: Record<string, unknown>): void {
  const {
    start_at: start,
    end_at: end,
    application_deadline: deadline,
    application_start_at: opening,
  } = event;
  const timestamp = (value: unknown) => new Date(String(value)).getTime();
  if (
    (start && end && timestamp(start) >= timestamp(end)) ||
    (start && deadline && timestamp(deadline) > timestamp(start)) ||
    (opening && deadline && timestamp(opening) > timestamp(deadline))
  ) {
    throw new ApiError(
      422,
      "BUSINESS_RULE_ERROR",
      "開催日時または申込期間が不正です",
    );
  }
  if (event.status !== "published" && event.status !== "completed") return;
  if (
    !String(event.title ?? "").trim() ||
    !String(event.description ?? "").trim() ||
    !event.category_id ||
    !event.format ||
    !start ||
    !end ||
    !event.capacity ||
    ((event.format === "online" || event.format === "hybrid") &&
      !String(event.online_url ?? "").trim()) ||
    ((event.format === "offline" || event.format === "hybrid") &&
      !String(event.venue_name ?? "").trim())
  ) {
    throw new ApiError(
      422,
      "BUSINESS_RULE_ERROR",
      "公開には説明・カテゴリ・開催形式・日時・定員・開催場所の入力が必要です",
    );
  }
}

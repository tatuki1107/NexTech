import { SECTIONS } from "./records";
import type { RecordSection } from "./records";

export type Change = {
  id: string;
  actorUserId: string | null;
  createdAt: string;
  action?: string;
  reason?: string | null;
  changeType?: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: { before?: unknown; after?: unknown; fromStatus?: string; status?: string } | null;
  fromStatus?: string | null;
  toStatus?: string;
};

const FIELDS: Record<string, string> = {
  title: "イベント名", summary: "概要", description: "説明",
  category_id: "カテゴリ", format: "開催形式", venue_name: "会場",
  start_at: "開始日時", end_at: "終了日時", capacity: "定員",
  address: "住所", online_url: "配信URL",
  name: "組織名", slug: "識別名", contact_email: "連絡先", website_url: "Webサイト",
  application_start_at: "申込開始日時", application_deadline: "申込締切",
  waitlist_enabled: "キャンセル待ち", participation_conditions: "参加条件",
};

function readSnapshot(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

export function historySummary(section: RecordSection, row: Change) {
  const before = readSnapshot(row.beforeData ?? row.metadata?.before);
  const after = readSnapshot(row.afterData ?? row.metadata?.after);
  const statuses: Record<string, string> = SECTIONS[section].statuses;
  const from = row.fromStatus ?? row.metadata?.fromStatus ?? before.status;
  const to = row.toStatus ?? row.metadata?.status ?? after.status;
  const statusLabel = (value: unknown) => typeof value === "string" ? statuses[value] ?? value : "—";
  const transition = typeof to === "string" && from !== to
    ? `${statusLabel(from)} → ${statusLabel(to)}` : "";
  const fields = Object.entries(FIELDS)
    .filter(([key]) => {
      if (!Object.hasOwn(before, key)) return false;
      // Event edits log the SQL row before the edit and the API patch after it.
      const apiKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
      const afterKey = Object.hasOwn(after, key) ? key : apiKey;
      if (!Object.hasOwn(after, afterKey)) return false;
      const oldValue = before[key];
      const newValue = after[afterKey];
      if (key.endsWith("_at") || key === "application_deadline") {
        if (typeof oldValue === "string" && typeof newValue === "string") {
          const oldTime = Date.parse(oldValue);
          return Number.isFinite(oldTime) ? oldTime !== Date.parse(newValue) : oldValue !== newValue;
        }
      }
      return oldValue !== newValue;
    })
    .map(([, label]) => label);
  if (row.changeType === "updated" && Object.hasOwn(after, "tagIds")) fields.push("タグ");
  const reason = row.reason ?? after.reason;
  return [transition, fields.join("、"), typeof reason === "string" ? reason : ""]
    .filter(Boolean).join(" / ");
}

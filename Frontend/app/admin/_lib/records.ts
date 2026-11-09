import { apiRequest } from "@/app/_lib/api";
import type { PageResult } from "@/app/_lib/api";

const EVENT_STATUSES = {
  draft: "下書き",
  published: "公開中",
  cancelled: "中止",
  completed: "終了",
};
const ORGANIZER_STATUSES = {
  active: "有効",
  inactive: "非アクティブ",
  suspended: "停止中",
};
const REGISTRATION_STATUSES = {
  pending: "確認待ち",
  confirmed: "参加確定",
  waitlisted: "キャンセル待ち",
  cancelled: "キャンセル",
  checked_in: "受付済み",
  no_show: "欠席",
};

export const SECTIONS = {
  events: {
    label: "イベント",
    title: "イベント一覧",
    detail: "イベント詳細",
    description:
      "全主催者のイベントを検索し、公開状況と開催情報を確認できます。",
    placeholder: "イベント名・主催者名で検索",
    dateLabel: "開催日",
    columns: ["イベント名", "主催者", "開催日時（JST）"],
    statuses: EVENT_STATUSES,
    target: "event",
  },
  organizers: {
    label: "主催者",
    title: "主催者一覧",
    detail: "主催者詳細",
    description: "登録されている主催者の組織情報と有効状態を確認できます。",
    placeholder: "組織名・スラッグで検索",
    dateLabel: "作成日",
    columns: ["組織名", "スラッグ", "作成日（JST）"],
    statuses: ORGANIZER_STATUSES,
    target: "organizer",
  },
  registrations: {
    label: "参加情報",
    title: "参加情報一覧",
    detail: "参加情報詳細",
    description:
      "イベントを横断して申込を検索し、参加状況や受付の記録を確認できます。",
    placeholder: "氏名・メール・申込番号で検索",
    dateLabel: "申込日",
    columns: ["参加者", "イベント", "申込日時（JST）"],
    statuses: REGISTRATION_STATUSES,
    target: "registration",
  },
} as const;

export type RecordSection = keyof typeof SECTIONS;
export type AdminSection = RecordSection | "history";
type TargetType = (typeof SECTIONS)[RecordSection]["target"];
export const TARGET_SECTIONS = {
  event: "events",
  organizer: "organizers",
  registration: "registrations",
} as const;

export type AdminRecord = {
  id: string;
  title: string;
  status: string;
  columns: [string, string];
  fields: [label: string, value: string][];
};

type EventRecord = {
  id: string;
  title: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  organizer: { name: string };
  format: "online" | "offline" | "hybrid" | null;
  capacity: number | null;
};
type OrganizerRecord = {
  id: string;
  name: string;
  status: string;
  slug: string;
  createdAt: string;
  contactEmail: string | null;
  description: string | null;
};
type RegistrationRecord = {
  id: string;
  status: string;
  appliedAt: string;
  checkedInAt: string | null;
  event: { title: string };
  user: { fullName: string | null; displayName: string; email: string };
};
export type ModerationRecord = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  targetType: TargetType;
  targetId: string;
  action: string;
  reason: string | null;
};

const DATE_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  dateStyle: "short",
});
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  dateStyle: "short",
  timeStyle: "short",
});
export function formatDate(value: string | null, dateOnly = false) {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? (dateOnly ? DATE_FORMAT : DATE_TIME_FORMAT).format(timestamp)
    : "—";
}

function mapEvent(row: EventRecord): AdminRecord {
  const formats = {
    online: "オンライン",
    offline: "会場開催",
    hybrid: "ハイブリッド",
  };
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    columns: [row.organizer.name, formatDate(row.startAt)],
    fields: [
      ["主催者", row.organizer.name],
      [
        "開催日時（JST）",
        row.endAt
          ? `${formatDate(row.startAt)} – ${formatDate(row.endAt)}`
          : formatDate(row.startAt),
      ],
      ["開催形式", row.format ? formats[row.format] : "—"],
      ["定員", row.capacity === null ? "—" : `${row.capacity} 名`],
    ],
  };
}
function mapOrganizer(row: OrganizerRecord): AdminRecord {
  return {
    id: row.id,
    title: row.name,
    status: row.status,
    columns: [row.slug, formatDate(row.createdAt, true)],
    fields: [
      ["スラッグ", row.slug],
      ["連絡先", row.contactEmail || "—"],
      ["作成日（JST）", formatDate(row.createdAt, true)],
      ["組織の説明", row.description || "—"],
    ],
  };
}
function mapRegistration(row: RegistrationRecord): AdminRecord {
  return {
    id: row.id,
    title: row.user.fullName || row.user.displayName,
    status: row.status,
    columns: [row.event.title, formatDate(row.appliedAt)],
    fields: [
      ["メールアドレス", row.user.email],
      ["イベント", row.event.title],
      ["申込日時（JST）", formatDate(row.appliedAt)],
      [
        "受付日時（JST）",
        row.checkedInAt ? formatDate(row.checkedInAt) : "未受付",
      ],
    ],
  };
}

async function fetchList<T>(
  path: string,
  map: (row: T) => AdminRecord,
  signal: AbortSignal,
) {
  const result = await apiRequest<PageResult<T>>(path, { signal });
  return { ...result, data: result.data.map(map) };
}
async function fetchDetail<T>(
  path: string,
  map: (row: T) => AdminRecord,
  signal: AbortSignal,
) {
  const result = await apiRequest<{ data: T }>(path, { signal });
  return map(result.data);
}

export function listRecords(
  section: RecordSection,
  query: string,
  signal: AbortSignal,
) {
  const path = `/admin/${section}?${query}`;
  switch (section) {
    case "events":
      return fetchList(path, mapEvent, signal);
    case "organizers":
      return fetchList(path, mapOrganizer, signal);
    case "registrations":
      return fetchList(path, mapRegistration, signal);
  }
}
export function getRecord(
  section: RecordSection,
  id: string,
  signal: AbortSignal,
) {
  const path = `/admin/${section}/${encodeURIComponent(id)}`;
  switch (section) {
    case "events":
      return fetchDetail(path, mapEvent, signal);
    case "organizers":
      return fetchDetail(path, mapOrganizer, signal);
    case "registrations":
      return fetchDetail(path, mapRegistration, signal);
  }
}
export function getHistory(query: string, signal: AbortSignal) {
  return apiRequest<PageResult<ModerationRecord>>(
    `/admin/moderation-actions?${query}`,
    { signal },
  );
}
export function actionLabel(row: ModerationRecord) {
  if (row.action === "reviewed") return "確認済み";
  if (row.targetType === "event" && row.action === "draft") return "公開停止";
  const statuses: Record<string, string> =
    SECTIONS[TARGET_SECTIONS[row.targetType]].statuses;
  return statuses[row.action] ?? row.action;
}

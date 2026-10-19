export type EventDetailData = {
  id: string;
  title: string;
  description: string;
  format: string;
  venueName: string | null;
  startAt: string;
  endAt: string;
  applicationDeadline: string | null;
  capacity: number;
  categoryName: string;
  organizerName: string;
  applicationCount: number;
  seatsLeft: number;
};

type EventDetailResult =
  | { status: "found"; event: EventDetailData }
  | { status: "not-found" }
  | { status: "unavailable" };

function isEventDetail(value: unknown): value is EventDetailData {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "format" in value &&
    typeof value.format === "string" &&
    "venueName" in value &&
    (typeof value.venueName === "string" || value.venueName === null) &&
    "startAt" in value &&
    typeof value.startAt === "string" &&
    "endAt" in value &&
    typeof value.endAt === "string" &&
    "applicationDeadline" in value &&
    (typeof value.applicationDeadline === "string" ||
      value.applicationDeadline === null) &&
    "capacity" in value &&
    typeof value.capacity === "number" &&
    "categoryName" in value &&
    typeof value.categoryName === "string" &&
    "organizerName" in value &&
    typeof value.organizerName === "string" &&
    "applicationCount" in value &&
    typeof value.applicationCount === "number" &&
    "seatsLeft" in value &&
    typeof value.seatsLeft === "number"
  );
}

export function formatEventDate(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return "日時未定";
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(start);
  const time = (value: Date) =>
    value.toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return `${date} ${time(start)} - ${time(end)}`;
}

export function formatDeadline(deadline: string | null) {
  if (!deadline)
    return { label: "設定なし", remaining: "", remainingDays: null };
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime()))
    return { label: "設定なし", remaining: "", remainingDays: null };
  const remainingDays = Math.max(
    0,
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const dateLabel = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
  const timeLabel = date.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return {
    label: `${dateLabel} ${timeLabel}`,
    remaining: `（残り${remainingDays}日）`,
    remainingDays,
  };
}

export async function getEventDetail(id: string): Promise<EventDetailResult> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return { status: "not-found" };
  }
  const apiBaseUrl =
    process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/events/${encodeURIComponent(id)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) return { status: "unavailable" };
    const value: unknown = await response.json();
    return typeof value === "object" &&
      value !== null &&
      "event" in value &&
      isEventDetail(value.event)
      ? { status: "found", event: value.event }
      : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

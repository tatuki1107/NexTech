export type EventDetailData = {
  id: string;
  title: string;
  description: string;
  format: string | null;
  venueName: string | null;
  startAt: string | null;
  endAt: string | null;
  applicationDeadline: string | null;
  capacity: number | null;
  categoryName: string;
  organizerName: string;
  applicationCount: number;
  seatsLeft: number;
  registrationStatus?: string | null;
  onlineUrl?: string | null;
  participationConditions?: string | null;
  applicationStartAt?: string | null;
  waitlistEnabled?: boolean;
  isArchived?: boolean;
};

export function formatEventDate(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) return "日時未定";
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

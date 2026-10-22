export type EventFormValues = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  venueUrl: string;
  capacity: string;
  tags: string[];
  description: string;
};

export const DESCRIPTION_MAX_LENGTH = 500;

export const DEFAULT_EVENT_DURATION_HOURS = 2;

/** 選択できるタグ。将来は参加者画面のカテゴリやAPIと揃える */
export const AVAILABLE_TAGS = [
  "フロントエンド",
  "バックエンド",
  "生成AI",
  "インフラ / クラウド",
  "セキュリティ",
  "UI / UXデザイン",
] as const;

export const EMPTY_EVENT_FORM: EventFormValues = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  venueUrl: "",
  capacity: "",
  tags: [],
  description: "",
};

/** "13:00" に時間を足した "15:00" を返す。日をまたぐ時刻は想定しないため、24時以降は空文字を返す */
export function addHoursToTime(time: string, hours: number): string {
  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";
  const endHour = hour + hours;
  if (endHour > 23) return "";
  return `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** input[type="date"] に渡すため、yyyy-mm-dd 形式で今日の日付を返す */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
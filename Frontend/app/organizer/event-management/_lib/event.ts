export type EventStatus = "published" | "draft" | "ended";

export type OrganizerEvent = {
  id: string;
  title: string;
  status: EventStatus;
  schedule: string;
  venue: string;
  applied: number;
  capacity: number;
  waitlisted: number;
};

/** 0〜100の整数で割合を返す。分母が0のときは0、100を超える場合は100にそろえる */
export function calculateRate(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}
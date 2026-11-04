import { apiRequest } from "@/app/_lib/api";
export { apiRequest, getAll, ApiError, errorMessage } from "@/app/_lib/api";
export type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  status: string;
  memberRole: string;
};
export type User = {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
};
export type Taxonomy = { id: string; name: string; slug: string };
export type ManagedEvent = {
  id: string;
  title: string;
  summary: string | null;
  description: string;
  participationConditions: string | null;
  category: Taxonomy | null;
  tags: Taxonomy[];
  organizer: Organization;
  format: "online" | "offline" | "hybrid" | null;
  venueName: string | null;
  address: string | null;
  onlineUrl: string | null;
  startAt: string | null;
  endAt: string | null;
  applicationStartAt: string | null;
  applicationDeadline: string | null;
  capacity: number | null;
  waitlistEnabled: boolean;
  status: "draft" | "published" | "completed" | "cancelled";
  confirmedCount: number;
  waitlistCount: number;
  version: number;
  updatedAt: string;
};
export type Registration = {
  id: string;
  status:
    | "pending"
    | "confirmed"
    | "waitlisted"
    | "cancelled"
    | "checked_in"
    | "no_show";
  waitlistPosition: number | null;
  appliedAt: string;
  checkedInAt: string | null;
  user: {
    id: string;
    displayName: string;
    fullName: string | null;
    email: string;
  };
};
export type RecruitmentSummary = {
  confirmedCount: number;
  waitlistCount: number;
  cancelledCount: number;
  attendedCount: number;
  availableSeats: number;
};
export type Analytics = {
  months: { month: string; registrationCount: number }[];
  categories: {
    groupId: string;
    groupName: string;
    registrationCount: number;
  }[];
  summary: {
    totalCount: number;
    registrationCount: number;
    cancelledCount: number;
    confirmedCount: number;
    attendedCount: number;
    participantCount: number;
    repeatParticipantCount: number;
  };
};
export const organizerPath = (id: string) =>
  `/organizers/${encodeURIComponent(id)}`;
export const managedEventPath = (org: string, id: string) =>
  `${organizerPath(org)}/events/${encodeURIComponent(id)}`;
export const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "未設定";
export const tokyoDate = (date = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export const eventView = (event: ManagedEvent) => ({
  id: event.id,
  title: event.title,
  status:
    event.status === "completed"
      ? ("ended" as const)
      : event.status === "cancelled"
        ? ("cancelled" as const)
        : event.status,
  schedule: formatDate(event.startAt),
  venue:
    event.venueName ||
    (event.format
      ? {
          online: "オンライン",
          offline: "会場開催",
          hybrid: "会場 / オンライン",
        }[event.format]
      : "未設定"),
  applied: event.confirmedCount,
  capacity: event.capacity ?? 0,
  waitlisted: event.waitlistCount,
});
export const registrationLabels: Record<Registration["status"], string> = {
  pending: "確認待ち",
  confirmed: "参加確定",
  waitlisted: "キャンセル待ち",
  cancelled: "キャンセル",
  checked_in: "受付済",
  no_show: "欠席",
};
export function csvContent(rows: string[][]) {
  // Prefix spreadsheet formulas, and quote commas/newlines/quotes.
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map(
            (cell) =>
              '"' +
              (/^(?:\s*[=+\-@]|[\t\r])/.test(cell)
                ? "'" + cell
                : cell
              ).replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n")
  );
}
export function downloadCsv(filename: string, rows: string[][]) {
  const content = csvContent(rows);
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
export const changeStatus = (id: string, status: ManagedEvent["status"]) =>
  apiRequest<{ data: ManagedEvent }>(`/events/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

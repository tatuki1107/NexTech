import type { EventStatus } from "../../event-management/_lib/event";

export type EventRequestSummary = {
  id: string;
  title: string;
  schedule: string;
  status: EventStatus;
  applied: number;
  waitlisted: number;
};

export type ApplicantStatus = "applied" | "waitlisted" | "cancelled";

export type Applicant = {
  id: string;
  name: string;
  email: string;
  requestNumber: string;
  appliedAt: string;
  status: ApplicantStatus;
};

export const APPLICANT_STATUS_LABELS: Record<ApplicantStatus, string> = {
  applied: "申込済",
  waitlisted: "キャンセル待ち",
  cancelled: "キャンセル",
};
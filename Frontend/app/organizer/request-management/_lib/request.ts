import type { EventStatus } from "../../event-management/_lib/event";

export type EventRequestSummary = {
  id: string;
  title: string;
  schedule: string;
  status: EventStatus;
  applied: number;
  waitlisted: number;
};

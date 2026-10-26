import type { EventStatus } from "./event";

export type EventDetail = {
  id: string;
  title: string;
  status: EventStatus;
  schedule: string;
  venue: string;
  capacity: number;
  tags: string[];
  description: string;
  publishPeriod: string;
  lastUpdated: string;
  applied: number;
  waitlisted: number;
  checkedIn: number;
};
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
export type User = {
  id: string;
  email: string;
  displayName: string;
  fullName: string | null;
  profileText: string | null;
};
export type NamedItem = { id: string; name: string; slug: string };
export type ParticipantEvent = {
  id: string;
  title: string;
  summary?: string | null;
  description?: string;
  format: string;
  venueName: string | null;
  address?: string | null;
  onlineUrl?: string | null;
  startAt: string;
  endAt: string;
  applicationStartAt?: string | null;
  applicationDeadline?: string | null;
  capacity: number;
  confirmedCount: number;
  waitlistCount: number;
  waitlistEnabled?: boolean;
  category: NamedItem;
  organizer: NamedItem;
  tags: NamedItem[];
  registrationStatus: string | null;
  participationConditions?: string | null;
};
export type Registration = {
  id: string;
  status: string;
  eventId: string;
  waitlistPosition: number | null;
  event: RegistrationEvent;
};
export type RegistrationEvent = Omit<ParticipantEvent, "category" | "startAt" | "endAt" | "format" | "capacity"> & {
  category: NamedItem | null;
  startAt: string | null;
  endAt: string | null;
  format: string | null;
  capacity: number | null;
};
export type Notification = {
  id: string;
  eventId: string | null;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};
export type NotificationSettings = {
  registrationUpdates: boolean;
  eventReminders: boolean;
  recommendations: boolean;
};

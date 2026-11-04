import type { ManagedEvent } from "../../_lib/api";
export type EventFormValues = {
  title: string;
  summary: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  venueUrl: string;
  capacity: string;
  tags: string[];
  description: string;
  categoryId: string;
  format: string;
  applicationStart: string;
  applicationDeadline: string;
  participationConditions: string;
  waitlistEnabled: boolean;
};
export const EMPTY_EVENT_FORM: EventFormValues = {
  title: "",
  summary: "",
  date: "",
  endDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  address: "",
  venueUrl: "",
  capacity: "",
  tags: [],
  description: "",
  categoryId: "",
  format: "",
  applicationStart: "",
  applicationDeadline: "",
  participationConditions: "",
  waitlistEnabled: false,
};
export function localDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(new Date(value).getTime() + 9 * 3600000);
  return date.toISOString().slice(0, 16);
}
export function eventFormValues(event: ManagedEvent): EventFormValues {
  const start = localDateTime(event.startAt),
    end = localDateTime(event.endAt);
  return {
    title: event.title,
    summary: event.summary ?? "",
    date: start.slice(0, 10),
    startTime: start.slice(11),
    endDate: end.slice(0, 10),
    endTime: end.slice(11),
    venue: event.venueName ?? "",
    address: event.address ?? "",
    venueUrl: event.onlineUrl ?? "",
    capacity: event.capacity?.toString() ?? "",
    tags: event.tags.map((tag) => tag.id),
    description: event.description,
    categoryId: event.category?.id ?? "",
    format: event.format ?? "",
    applicationStart: localDateTime(event.applicationStartAt),
    applicationDeadline: localDateTime(event.applicationDeadline),
    participationConditions: event.participationConditions ?? "",
    waitlistEnabled: event.waitlistEnabled,
  };
}
export function eventPayload(values: EventFormValues) {
  const timestamp = (value: string) =>
    new Date(value + ":00+09:00").toISOString();
  const start =
    values.date && values.startTime
      ? timestamp(values.date + "T" + values.startTime)
      : null;
  const end =
    values.endDate && values.endTime
      ? timestamp(values.endDate + "T" + values.endTime)
      : null;
  if (start && end && start >= end)
    throw new Error("終了日時は開始日時より後にしてください");
  if (
    values.capacity &&
    (!Number.isSafeInteger(Number(values.capacity)) ||
      Number(values.capacity) < 1)
  )
    throw new Error("定員は1以上の整数にしてください");
  return {
    title: values.title.trim(),
    summary: values.summary,
    description: values.description,
    categoryId: values.categoryId || null,
    format: values.format || null,
    venueName: values.venue,
    address: values.address,
    onlineUrl: values.venueUrl || null,
    startAt: start,
    endAt: end,
    capacity: values.capacity ? Number(values.capacity) : null,
    tagIds: values.tags,
    waitlistEnabled: values.waitlistEnabled,
    applicationStartAt: values.applicationStart
      ? timestamp(values.applicationStart)
      : null,
    applicationDeadline: values.applicationDeadline
      ? timestamp(values.applicationDeadline)
      : null,
    participationConditions: values.participationConditions || null,
  };
}

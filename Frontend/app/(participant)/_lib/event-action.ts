import type { EventDetailData } from "./event-detail";

type EventActionPolicy = {
  kind: "apply" | "cancel" | "history";
  disabledReason?: string;
};

export function getEventActionPolicy(
  event: EventDetailData,
  now: number,
): EventActionPolicy {
  const registered = Boolean(
    event.registrationStatus && event.registrationStatus !== "cancelled",
  );
  const started = event.startAt !== null && new Date(event.startAt).getTime() <= now;
  const cancellableStatus = ["pending", "confirmed", "waitlisted"].includes(
    event.registrationStatus ?? "",
  );
  // A missing public detail also means paused/moderated, not just finished.
  // The authenticated registration still permits cancellation before the start.
  if (event.isArchived && (!registered || started || !cancellableStatus))
    return { kind: "history" };
  if (registered)
    return {
      kind: "cancel",
      disabledReason: started
        ? "開催後はキャンセルできません"
        : !cancellableStatus
          ? "この申込はキャンセルできません"
          : undefined,
    };
  if (
    started ||
    (event.applicationDeadline &&
      new Date(event.applicationDeadline).getTime() < now)
  )
    return { kind: "apply", disabledReason: "申込受付は終了しました" };
  if (
    event.applicationStartAt &&
    new Date(event.applicationStartAt).getTime() > now
  )
    return { kind: "apply", disabledReason: "申込受付開始前です" };
  if (event.seatsLeft === 0 && !event.waitlistEnabled)
    return { kind: "apply", disabledReason: "満席です" };
  return { kind: "apply" };
}

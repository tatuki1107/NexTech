import type { Registration } from "./types";

function startTime(registration: Registration) {
  const startAt = registration.effectiveStartAt ?? registration.event.startAt;
  const time = startAt ? Date.parse(startAt) : Number.NaN;
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

export function mergeRegistrationHistory(
  past: Registration[],
  cancelled: Registration[],
) {
  // A cancelled registration for a past event is returned by both views.
  const unique = new Map([...past, ...cancelled].map((row) => [row.id, row]));
  return [...unique.values()].sort(
    (first, second) => startTime(second) - startTime(first) || first.id.localeCompare(second.id),
  );
}

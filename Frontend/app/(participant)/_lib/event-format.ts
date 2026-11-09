export const EVENT_FORMAT_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "offline", label: "会場" },
  { value: "online", label: "オンライン" },
  { value: "hybrid", label: "ハイブリッド" },
] as const;

export type EventFormatFilter = (typeof EVENT_FORMAT_OPTIONS)[number]["value"];

export function getEventFormatLabel(format: string | null) {
  if (format === "all") return null;
  return EVENT_FORMAT_OPTIONS.find(({ value }) => value === format)?.label ?? null;
}

export function parseEventFormatFilter(value: string | null): EventFormatFilter {
  // Older search links used the displayed label rather than the API value.
  if (value === "会場開催") return "offline";
  return EVENT_FORMAT_OPTIONS.find((option) => option.value === value || option.label === value)?.value ?? "all";
}

export function matchesEventFormat(eventFormat: string, filter: EventFormatFilter) {
  return filter === "all" || eventFormat === filter;
}

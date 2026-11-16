export const METRIC_LABELS = {
  events: "開催数",
  registrations: "申込数",
  participants: "参加者数",
  attendance: "受付数",
  applicationRate: "申込率",
} as const;

export type AnalyticsMetric = keyof typeof METRIC_LABELS;

export function readMetric(value: unknown): AnalyticsMetric {
  return typeof value === "string" && Object.hasOwn(METRIC_LABELS, value)
    ? value as AnalyticsMetric
    : "registrations";
}

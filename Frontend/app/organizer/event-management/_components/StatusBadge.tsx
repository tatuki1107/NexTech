import type { EventStatus } from "../_lib/event";

type StatusBadgeProps = {
  status: EventStatus;
};

const STATUS_STYLES: Record<EventStatus, { label: string; className: string }> = {
  published: {
    label: "公開中",
    className: "bg-bg-accent-green text-fg-accent-green",
  },
  draft: {
    label: "下書き",
    className: "bg-bg-accent-yellow text-fg-accent-yellow",
  },
  ended: {
    label: "開催済み",
    className: "bg-ol-neutral-primary text-fg-neutral-secondary",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = STATUS_STYLES[status];

  return (
    <span
      className={`inline-block rounded-full px-4 py-1 ${className}`}
    >
      {label}
    </span>
  );
}
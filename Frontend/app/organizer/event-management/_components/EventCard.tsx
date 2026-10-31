import type { ReactNode } from "react";

import type { OrganizerEvent } from "../_lib/event";
import StatusBadge from "./StatusBadge";

type EventCardProps = {
  event: OrganizerEvent;
  summary: string;
  rate: number;
  rateLabel: string;
  actions: ReactNode;
};

export default function EventCard({
  event,
  summary,
  rate,
  rateLabel,
  actions,
}: EventCardProps) {
  const isEnded = event.status === "ended";

  return (
    <article
      className={`flex items-stretch justify-between gap-8 rounded-xl border border-ol-neutral-primary p-6 ${
        isEnded ? "bg-bg-neutral-primary" : "bg-white"
      }`}
    >
      <div className="space-y-3">
        <StatusBadge status={event.status} />
        <h3 className="text-lg font-bold text-fg-neutral-primary">
          {event.title}
        </h3>
        <p className="text-xs text-fg-neutral-secondary">
          {event.schedule}　{event.venue}
        </p>
        <p className="text-sm text-fg-neutral-primary">{summary}</p>
      </div>

      <div className="flex w-105 shrink-0 flex-col justify-between">
        {/* mt-10: バッジ(24px) + 間隔(12px) + タイトル行との差(4px)。バーをタイトルの高さに揃えるための値 */}
        <div className="mt-10 flex h-5 items-center gap-4">
          <div
            role="progressbar"
            aria-label={rateLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rate}
            className="h-2 flex-1 overflow-hidden rounded-full bg-ol-neutral-primary"
          >
            <div
              className={`h-full rounded-full ${
                isEnded ? "bg-fg-neutral-secondary" : "bg-fg-brand-primary"
              }`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs text-fg-neutral-secondary">
            {rate}%
          </span>
        </div>

        <div className="flex justify-end gap-3">{actions}</div>
      </div>
    </article>
  );
}

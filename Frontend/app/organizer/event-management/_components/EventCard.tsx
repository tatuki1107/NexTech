import Link from "next/link";

import type { OrganizerEvent } from "../_lib/event";
import StatusBadge from "./StatusBadge";

type EventCardProps = {
  event: OrganizerEvent;
};

const BUTTON_BASE =
  "flex h-12 w-24 items-center justify-center rounded-xl border-2 bg-white text-base";
const EDIT_BUTTON = `${BUTTON_BASE} border-fg-neutral-secondary text-fg-neutral-secondary`;
const DETAIL_BUTTON = `${BUTTON_BASE} border-fg-brand-primary text-fg-brand-primary`;
const PUBLISH_BUTTON = `${BUTTON_BASE} border-fg-accent-green text-fg-accent-green`;
const DELETE_BUTTON = `${BUTTON_BASE} border-fg-warning-primary text-fg-warning-primary`;

export default function EventCard({ event }: EventCardProps) {
  const isEnded = event.status === "ended";
  const rate =
    event.capacity > 0
      ? Math.min(100, Math.round((event.applied / event.capacity) * 100))
      : 0;

  return (
    <article
      className={`flex items-stretch justify-between gap-8 rounded-xl border border-ol-neutral-primary p-6 ${
        isEnded ? "bg-bg-neutral-primary" : "bg-white"
      }`}
    >
      <div className="space-y-3">
        <StatusBadge status={event.status} />
        <h3 className="text-xl font-bold text-fg-neutral-primary">
          {event.title}
        </h3>
        <p className="text-sm text-fg-neutral-secondary">
          {event.schedule}　{event.venue}
        </p>
        <p className="text-fg-neutral-primary">
          申込 {event.applied} / 定員 {event.capacity}　待機 {event.waitlisted}
        </p>
      </div>

      <div className="flex w-105 shrink-0 flex-col justify-between">
        {/* mt-10: バッジ(24px) + 間隔(12px) + タイトル行との差(4px)。バーをタイトルの高さに揃えるための値 */}
        <div className="mt-10 flex h-5 items-center gap-4">
          <div
            role="progressbar"
            aria-label="申込率"
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
          <span className="w-10 text-right text-sm text-fg-neutral-secondary">
            {rate}%
          </span>
        </div>

        <div className="flex justify-end gap-3">
          {event.status === "published" && (
            <>
              <Link
                href={`/organizer/event-management/${event.id}/edit`}
                className={EDIT_BUTTON}
              >
                編集
              </Link>
              <Link
                href={`/organizer/event-management/${event.id}`}
                className={DETAIL_BUTTON}
              >
                詳細
              </Link>
              {/* 動作は確認モーダルと一緒に別PRで実装 */}
              <button type="button" className={DELETE_BUTTON}>
                削除
              </button>
            </>
          )}
          {event.status === "draft" && (
            <>
              <Link
                href={`/organizer/event-management/${event.id}/edit`}
                className={EDIT_BUTTON}
              >
                編集
              </Link>
              <button type="button" className={PUBLISH_BUTTON}>
                公開
              </button>
              <button type="button" className={DELETE_BUTTON}>
                削除
              </button>
            </>
          )}
          {isEnded && (
            <Link
              href={`/organizer/event-management/${event.id}`}
              className={DETAIL_BUTTON}
            >
              詳細
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
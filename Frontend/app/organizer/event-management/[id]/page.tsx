import Link from "next/link";

import { MOCK_EVENT_DETAIL } from "../../_mocks/events";
import StatusBadge from "../_components/StatusBadge";
import DetailCard from "../_components/detail/DetailCard";
import DetailRow from "../_components/detail/DetailRow";

export default function EventDetailPage() {
  const event = MOCK_EVENT_DETAIL;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/organizer/event-management"
          className="flex w-fit items-center gap-2 text-sm text-fg-neutral-secondary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          イベント一覧に戻る
        </Link>
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold text-fg-neutral-primary">
              {event.title}
            </h1>
            <StatusBadge status={event.status} />
          </div>
          <Link
            href={`/organizer/event-management/${event.id}/edit`}
            className="flex h-14 shrink-0 items-center rounded-xl bg-fg-brand-primary px-8 text-sm font-bold text-fg-inverse-primary"
          >
            イベントを編集
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <DetailCard title="イベント情報">
          <dl>
            <DetailRow label="開催日時" value={event.schedule} />
            <DetailRow label="開催場所" value={event.venue} />
            <DetailRow label="定員" value={`${event.capacity}名`} />
            <DetailRow label="タグ" value={event.tags.join(" / ")} />
          </dl>
        </DetailCard>

        <DetailCard title="申込状況">
          <dl>
            <DetailRow
              label="申込"
              value={`${event.applied} / ${event.capacity}名`}
              valueClassName="text-fg-brand-primary"
            />
            <DetailRow label="キャンセル待ち" value={`${event.waitlisted}名`} />
            <DetailRow
              label="受付済み"
              value={`${event.checkedIn}名`}
              valueClassName="text-fg-accent-green"
            />
          </dl>
          <Link
            href="/organizer/request-management"
            className="mt-4 flex h-14 items-center justify-center rounded-xl border-2 border-fg-brand-primary text-sm font-bold text-fg-brand-primary"
          >
            申込者一覧を見る
          </Link>
        </DetailCard>
      </div>

      <DetailCard title="イベント内容">
        <p className="whitespace-pre-line text-base text-fg-neutral-primary">
          {event.description}
        </p>
        <dl className="mt-8">
          <DetailRow label="公開期間" value={event.publishPeriod} />
          <DetailRow label="最終更新" value={event.lastUpdated} />
        </dl>
      </DetailCard>
    </div>
  );
}

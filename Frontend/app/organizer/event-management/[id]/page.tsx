import Link from "next/link";

import StatusBadge from "../_components/StatusBadge";
import DetailCard from "../_components/detail/DetailCard";
import DetailRow from "../_components/detail/DetailRow";
import type { EventDetail } from "../_lib/event-detail";

// 仮データ。APIができたら、URLのidで取得したイベントに置き換える
const SAMPLE_EVENT: EventDetail = {
  id: "1",
  title: "React UI設計ワークショップ",
  status: "published",
  schedule: "2026/06/14(土) 13:00 - 16:00",
  venue: "名古屋 / オンライン",
  capacity: 40,
  tags: ["フロントエンド", "初心者向け"],
  description:
    "コンポーネント設計とアクセシビリティの基礎を、演習形式で学びます。\n実際のUIを題材に、再利用しやすい設計とレビュー方法を身につけます。",
  publishPeriod: "2026/05/01 12:00 〜 2026/06/12 23:59",
  lastUpdated: "2026/05/01 17:30　山田 太郎",
  applied: 32,
  waitlisted: 0,
  checkedIn: 16,
};

export default function EventDetailPage() {
  const event = SAMPLE_EVENT;

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
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-fg-neutral-primary">
              {event.title}
            </h1>
            <StatusBadge status={event.status} />
          </div>
          <Link
            href={`/organizer/event-management/${event.id}/edit`}
            className="flex h-14 items-center rounded-xl bg-fg-brand-primary px-8 text-sm font-bold text-fg-inverse-primary"
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

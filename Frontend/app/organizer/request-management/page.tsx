import EventRequestTable from "./_components/EventRequestTable";
import SummaryCard from "./_components/SummaryCard";
import type { EventRequestSummary } from "./_lib/request";

// 仮データ。APIができたら置き換える
const events: EventRequestSummary[] = [
  {
    id: "1",
    title: "React UI設計ワークショップ",
    schedule: "6/14(土) 13:00",
    status: "published",
    applied: 32,
    waitlisted: 0,
  },
  {
    id: "2",
    title: "LLMアプリ開発入門",
    schedule: "6/21(土) 18:30",
    status: "full",
    applied: 40,
    waitlisted: 12,
  },
  {
    id: "3",
    title: "デザインシステム実践講座",
    schedule: "6/28(土) 10:00",
    status: "published",
    applied: 28,
    waitlisted: 2,
  },
  {
    id: "4",
    title: "TypeScript設計レビュー会",
    schedule: "7/05(土) 14:00",
    status: "draft",
    applied: 18,
    waitlisted: 4,
  },
  {
    id: "5",
    title: "キャリア相談ミートアップ",
    schedule: "7/12(土) 19:00",
    status: "draft",
    applied: 10,
    waitlisted: 0,
  },
];

const totalApplied = events.reduce((sum, event) => sum + event.applied, 0);
const totalWaitlisted = events.reduce(
  (sum, event) => sum + event.waitlisted,
  0,
);
const waitlistedEventCount = events.filter(
  (event) => event.waitlisted > 0,
).length;

const SEARCH_CLASS =
  "h-14 rounded-xl border border-ol-neutral-primary bg-white px-4 text-base text-fg-neutral-primary placeholder:text-fg-neutral-secondary focus:outline-2 focus:outline-fg-brand-primary";

export default function RequestManagementPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-fg-neutral-primary">申込管理</h1>
        <p className="mt-2 text-xs text-fg-neutral-secondary">
          イベントごとの申込数・キャンセル待ち・公開状況を確認できます
        </p>
      </header>

      <div className="grid w-125 grid-cols-2 gap-6">
        <SummaryCard
          label="申込合計"
          value={String(totalApplied)}
          note="全イベント"
        />
        <SummaryCard
          label="キャンセル待ち"
          value={String(totalWaitlisted)}
          note={`${waitlistedEventCount}イベント`}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-fg-neutral-primary">
          イベント別申込状況
        </h2>
        {/* 検索・並び替え・絞り込みは見た目のみ。動作は別PRで実装 */}
        <div className="flex gap-4">
          <input
            type="search"
            aria-label="イベント名で検索"
            placeholder="イベント名で検索"
            className={`${SEARCH_CLASS} flex-1`}
          />
          <div className="relative">
            <select
              aria-label="並び替え"
              className={`${SEARCH_CLASS} w-45 appearance-none pr-12 text-center`}
            >
              <option>更新日順</option>
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-neutral-primary"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          <div className="relative">
            <select
              aria-label="公開状況で絞り込み"
              className={`${SEARCH_CLASS} w-45 appearance-none pr-12 text-center`}
            >
              <option value="">すべての状態</option>
              <option value="published">公開中</option>
              <option value="full">満席</option>
              <option value="draft">下書き</option>
              <option value="ended">開催済み</option>
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-neutral-primary"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        <EventRequestTable events={events} />
      </section>
    </div>
  );
}

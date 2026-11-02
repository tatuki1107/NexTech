import StatCard from "../_components/dashboard/StatCard";
import {
  MOCK_ANALYTICS_STATS,
  MOCK_CATEGORY_COUNTS,
  MOCK_INSIGHTS,
  MOCK_WEEKLY_COUNTS,
} from "../_mocks/analytics";
import DetailCard from "../event-management/_components/detail/DetailCard";
import CategoryBreakdown from "./_components/CategoryBreakdown";
import InsightCard from "./_components/InsightCard";
import WeeklyChart from "./_components/WeeklyChart";

export default function AnalyticsReportPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-fg-neutral-primary">
            分析レポート
          </h1>
          <p className="mt-2 text-xs text-fg-neutral-secondary">
            イベントの申込・参加・継続率を確認できます
          </p>
        </div>
        {/* 期間の切り替えは見た目のみ。動作はAPI接続のPRで実装 */}
        <div className="relative shrink-0">
          <select
            aria-label="集計期間"
            className="h-14 w-57 appearance-none rounded-xl border border-ol-neutral-primary bg-white pr-6 text-center text-sm text-fg-neutral-primary focus:outline-2 focus:outline-fg-brand-primary"
          >
            <option>2026年4月〜6月</option>
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
      </header>

      <section aria-label="集計" className="grid grid-cols-4 gap-6">
        {MOCK_ANALYTICS_STATS.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            note={stat.note}
            valueClassName={stat.colorClassName}
            noteClassName={stat.colorClassName}
          />
        ))}
      </section>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <DetailCard title="申込数の推移">
          <WeeklyChart weeks={MOCK_WEEKLY_COUNTS} />
        </DetailCard>
        <DetailCard title="カテゴリ別申込">
          <CategoryBreakdown categories={MOCK_CATEGORY_COUNTS} />
        </DetailCard>
      </div>

      <DetailCard title="インサイト">
        <div className="grid grid-cols-3 gap-6">
          {MOCK_INSIGHTS.map((insight) => (
            <InsightCard key={insight.title} insight={insight} />
          ))}
        </div>
      </DetailCard>
    </div>
  );
}

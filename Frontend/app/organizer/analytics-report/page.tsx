import StatCard from "../_components/dashboard/StatCard";
import DetailCard from "../event-management/_components/detail/DetailCard";
import CategoryBreakdown from "./_components/CategoryBreakdown";
import InsightCard from "./_components/InsightCard";
import WeeklyChart from "./_components/WeeklyChart";
import type {
  AnalyticsStat,
  CategoryCount,
  Insight,
  WeeklyCount,
} from "./_lib/analytics";

// 仮データ。APIができたら、選択した期間の集計に置き換える
const stats: AnalyticsStat[] = [
  {
    label: "総申込数",
    value: "128",
    note: "+18% 前期間比",
    colorClassName: "text-fg-brand-primary",
  },
  {
    label: "参加率",
    value: "82%",
    note: "+6.2% 前期間比",
    colorClassName: "text-fg-accent-green",
  },
  {
    label: "キャンセル率",
    value: "8.4%",
    note: "-2.1% 前期間比",
    colorClassName: "text-fg-neutral-primary",
  },
  {
    label: "リピート率",
    value: "46%",
    note: "+12% 前期間比",
    colorClassName: "text-fg-brand-primary",
  },
];

const weeks: WeeklyCount[] = [
  { label: "1週", count: 14 },
  { label: "2週", count: 22 },
  { label: "3週", count: 16 },
  { label: "4週", count: 28 },
  { label: "5週", count: 32 },
  { label: "6週", count: 30 },
  { label: "7週", count: 40 },
  { label: "8週", count: 38 },
  { label: "9週", count: 46 },
  { label: "10週", count: 52 },
];

const categories: CategoryCount[] = [
  { name: "フロントエンド", count: 86 },
  { name: "生成AI", count: 72 },
  { name: "バックエンド", count: 54 },
  { name: "UI/UX", count: 41 },
  { name: "キャリア", count: 28 },
];

const insights: Insight[] = [
  {
    title: "生成AIカテゴリが前期間比32%増加",
    description: "次回イベント枠の増加を検討しましょう",
    className: "bg-bg-accent-purple",
  },
  {
    title: "開催前日リマインド後の参加率が9%向上",
    description: "現在の通知設定を継続するのがおすすめです",
    className: "bg-bg-accent-green",
  },
  {
    title: "土曜午後のキャンセル率が最も低い",
    description: "人気枠として優先的に日程を設定できます",
    className: "bg-bg-accent-blue",
  },
];

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
        {stats.map((stat) => (
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
          <WeeklyChart weeks={weeks} />
        </DetailCard>
        <DetailCard title="カテゴリ別申込">
          <CategoryBreakdown categories={categories} />
        </DetailCard>
      </div>

      <DetailCard title="インサイト">
        <div className="grid grid-cols-3 gap-6">
          {insights.map((insight) => (
            <InsightCard key={insight.title} insight={insight} />
          ))}
        </div>
      </DetailCard>
    </div>
  );
}

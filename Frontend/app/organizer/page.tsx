import NextEventCard from "./_components/dashboard/NextEventCard";
import QuickActionCard from "./_components/dashboard/QuickActionCard";
import StatCard from "./_components/dashboard/StatCard";
import { MOCK_DASHBOARD_STATS } from "./_mocks/analytics";
import { MOCK_NEXT_EVENT } from "./_mocks/events";

// 画面の導線の設定なので、仮データではなくページに置く
const quickActions = [
  {
    title: "新しいイベントを作成",
    description: "開催内容・定員・受付期間を設定",
    href: "/organizer/event-management",
    className: "bg-bg-accent-blue",
  },
  {
    title: "申込状況を確認",
    description: "申込数とキャンセル待ちを確認",
    href: "/organizer/request-management",
    className: "bg-bg-accent-green",
  },
  {
    title: "分析レポートを見る",
    description: "参加率や流入傾向を確認",
    href: "/organizer/analytics-report",
    className: "bg-bg-accent-purple",
  },
];

export default function OrganizerPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-fg-neutral-primary">
          ダッシュボード
        </h1>
        <p className="mt-2 text-xs text-fg-neutral-secondary">
          運営状況の要点と、よく使う操作
        </p>
      </header>

      <section aria-label="集計" className="grid grid-cols-4 gap-6">
        {MOCK_DASHBOARD_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-fg-neutral-primary">
          クイックアクション
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-fg-neutral-primary">
          次の開催
        </h2>
        <NextEventCard event={MOCK_NEXT_EVENT} />
      </section>
    </div>
  );
}

import NextEventCard from "./_components/dashboard/NextEventCard";
import QuickActionCard from "./_components/dashboard/QuickActionCard";
import StatCard from "./_components/dashboard/StatCard";

// 仮データ。APIができたら置き換える
const stats = [
  { label: "公開中イベント", value: "3", note: "イベント管理で詳細を確認", valueClassName: "text-fg-brand-primary" },
  { label: "今月の申込", value: "128", note: "前月比 +12%", valueClassName: "text-fg-accent-green" },
  { label: "平均参加率", value: "87%", note: "直近3イベント", valueClassName: "text-fg-neutral-primary" },
  { label: "次回開催", value: "6/14", note: "13:00 開始", valueClassName: "text-fg-neutral-primary" },
];

const quickActions = [
  { title: "新しいイベントを作成", description: "開催内容・定員・受付期間を設定", href: "/organizer/event-management", className: "bg-bg-accent-blue" },
  { title: "申込状況を確認", description: "申込数とキャンセル待ちを確認", href: "/organizer/request-management", className: "bg-bg-accent-green" },
  { title: "分析レポートを見る", description: "参加率や流入傾向を確認", href: "/organizer/analytics-report", className: "bg-bg-accent-purple" },
];

const nextEvent = {
  title: "React UI設計ワークショップ",
  schedule: "2026/06/14(土) 13:00 - 16:00　名古屋 / オンライン",
  applied: 32,
  capacity: 40,
  attendanceRate: 87,
};

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
        {stats.map((stat) => (
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
        <NextEventCard event={nextEvent} />
      </section>
    </div>
  );
}
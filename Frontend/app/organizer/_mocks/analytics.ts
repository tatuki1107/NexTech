// API接続までの仮データ。各画面をAPIに置き換えたら、該当するデータを削除する
import type { StatCardProps } from "../_components/dashboard/StatCard";
import type {
  AnalyticsStat,
  CategoryCount,
  Insight,
  WeeklyCount,
} from "../analytics-report/_lib/analytics";

/** ダッシュボード: 集計 */
export const MOCK_DASHBOARD_STATS: StatCardProps[] = [
  { label: "公開中イベント", value: "3", note: "イベント管理で詳細を確認", valueClassName: "text-fg-brand-primary" },
  { label: "今月の申込", value: "128", note: "前月比 +12%", valueClassName: "text-fg-accent-green" },
  { label: "平均参加率", value: "87%", note: "直近3イベント", valueClassName: "text-fg-neutral-primary" },
  { label: "次回開催", value: "6/14", note: "13:00 開始", valueClassName: "text-fg-neutral-primary" },
];

/** 分析レポート: 集計 */
export const MOCK_ANALYTICS_STATS: AnalyticsStat[] = [
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

/** 分析レポート: 週ごとの申込数 */
export const MOCK_WEEKLY_COUNTS: WeeklyCount[] = [
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

/** 分析レポート: カテゴリ別申込 */
export const MOCK_CATEGORY_COUNTS: CategoryCount[] = [
  { name: "フロントエンド", count: 86 },
  { name: "生成AI", count: 72 },
  { name: "バックエンド", count: 54 },
  { name: "UI/UX", count: 41 },
  { name: "キャリア", count: 28 },
];

/** 分析レポート: インサイト */
export const MOCK_INSIGHTS: Insight[] = [
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
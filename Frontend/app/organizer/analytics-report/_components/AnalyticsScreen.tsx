"use client";
import { useState } from "react";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, PageTitle, CONTROL } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import {
  organizerPath,
  tokyoDate,
  downloadCsv,
  type Analytics,
} from "../../_lib/api";
import StatCard from "../../_components/dashboard/StatCard";
import DetailCard from "../../event-management/_components/detail/DetailCard";
import WeeklyChart from "./WeeklyChart";
import CategoryBreakdown from "./CategoryBreakdown";
export default function AnalyticsScreen() {
  const { organization } = useOrganizer();
  const today = tokyoDate();
  const [from, setFrom] = useState(today.slice(0, 4) + "-01-01");
  const [to, setTo] = useState(today);
  const valid = !!from && !!to && from <= to;
  return (
    <div className="space-y-8">
      <PageTitle title="分析レポート" />
      <div className="flex flex-wrap gap-4">
        <label>
          開始日
          <input
            aria-label="集計開始日"
            type="date"
            className={CONTROL}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          終了日
          <input
            aria-label="集計終了日"
            type="date"
            className={CONTROL}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <p>
        指定期間に開催する公開・開催済みイベントを集計します。日時は日本時間です。
      </p>
      {valid ? (
        <AnalyticsResults from={from} to={to} organizerId={organization.id} />
      ) : (
        <p role="alert">開始日・終了日を確認してください。</p>
      )}
    </div>
  );
}
function AnalyticsResults({
  organizerId,
  from,
  to,
}: {
  organizerId: string;
  from: string;
  to: string;
}) {
  const { data, error, reload } = useResource<Analytics>(
    organizerPath(organizerId) + `/analytics?from=${from}&to=${to}`,
  );
  if (!data) return <ApiState error={error} retry={reload} />;
  const s = data.summary;
  const rate = (n: number, d: number) =>
    d ? ((n / d) * 100).toFixed(1) + "%" : "—";
  return (
    <>
      <button
        type="button"
        className={CONTROL}
        onClick={() =>
          downloadCsv("analytics.csv", [
            ["開催月", "申込数（取消を除く）"],
            ...data.months.map((row) => [
              row.month,
              String(row.registrationCount),
            ]),
          ])
        }
      >
        CSV出力
      </button>
      <section className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {[
          ["申込数", String(s.registrationCount), "取消を除く"],
          [
            "参加率",
            rate(s.attendedCount, s.confirmedCount),
            "受付済 / 参加確定枠",
          ],
          [
            "キャンセル率",
            rate(s.cancelledCount, s.totalCount),
            "取消 / 全申込",
          ],
          [
            "リピート率",
            rate(s.repeatParticipantCount, s.participantCount),
            "期間内に複数イベントへ参加確定した人数 / 参加確定人数",
          ],
        ].map(([label, value, note]) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            note={note}
            valueClassName="text-fg-brand-primary"
          />
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <DetailCard title="開催月ごとの申込数">
          <WeeklyChart
            weeks={data.months.map((row) => ({
              label: row.month,
              count: row.registrationCount,
            }))}
          />
        </DetailCard>
        <DetailCard title="カテゴリ別申込">
          <CategoryBreakdown
            categories={data.categories.map((row) => ({
              name: row.groupName,
              count: row.registrationCount,
            }))}
          />
        </DetailCard>
      </div>
    </>
  );
}

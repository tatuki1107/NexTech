"use client";

import { useCallback } from "react";
import { apiRequest } from "@/app/_lib/api";
import { useAdminData } from "../_lib/use-admin-data";
import { METRIC_LABELS } from "../_lib/analytics";
import type { AnalyticsMetric } from "../_lib/analytics";
import AdminDataState from "./AdminDataState";
import AdminPageHeader from "./AdminPageHeader";
import styles from "../admin.module.css";

type Counts = {
  eventCount: number;
  registrationCount: number;
  participantCount: number;
  attendedCount: number;
};
type Month = Counts & { month: string };
type Group = Counts & { groupId: string; groupName: string; applicationRate: number | null };
const FORMAT_LABELS: Record<string, string> = { online: "オンライン", offline: "会場開催", hybrid: "ハイブリッド" };
const percent = new Intl.NumberFormat("ja-JP", { style: "percent", maximumFractionDigits: 1 });

function MetricsTable({ title, label, rows, showRate = false }: {
  title: string;
  label: string;
  rows: Array<Counts & { id: string; name: string; applicationRate?: number | null }>;
  showRate?: boolean;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeading}><h2>{title}</h2></div>
      {rows.length === 0 ? <AdminDataState message="該当するイベントはありません。" /> : (
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={title}>
          <table className={styles.table}>
            <thead><tr>
              <th scope="col">{label}</th><th scope="col">開催数</th><th scope="col">申込数</th>
              <th scope="col">参加者数</th><th scope="col">受付数</th>
              {showRate && <th scope="col">申込率</th>}
            </tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.name}</th><td>{row.eventCount}</td><td>{row.registrationCount}</td>
                <td>{row.participantCount}</td><td>{row.attendedCount}</td>
                {showRate && <td>{row.applicationRate == null ? "—" : percent.format(row.applicationRate)}</td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const getMonthly = (from: string, to: string, signal: AbortSignal) =>
  apiRequest<{ data: Month[] }>(`/admin/analytics/monthly-participants?${new URLSearchParams({ from, to })}`, { signal });

export default function AdminAnalytics({ from, to, groupBy, metric, compareFrom, compareTo }: {
  from: string; to: string; groupBy: "category" | "organizer" | "format";
  metric: AnalyticsMetric; compareFrom: string; compareTo: string;
}) {
  const dateError = from > to
    ? "終了日を開始日以降にしてください。"
    : Boolean(compareFrom) !== Boolean(compareTo)
      ? "比較期間の開始日と終了日を両方入力してください。"
      : compareFrom > compareTo ? "比較期間の終了日を開始日以降にしてください。" : "";
  const load = useCallback(async (signal: AbortSignal) => {
    if (dateError) throw new Error(dateError);
    const breakdown = new URLSearchParams({ from, to, groupBy, metric, limit: "10" });
    const [monthly, groups, comparison] = await Promise.all([
      getMonthly(from, to, signal),
      apiRequest<{ data: Group[] }>(`/admin/analytics/breakdown?${breakdown}`, { signal }),
      compareFrom && compareTo ? getMonthly(compareFrom, compareTo, signal) : null,
    ]);
    return { monthly: monthly.data, groups: groups.data, comparison: comparison?.data };
  }, [from, to, groupBy, metric, compareFrom, compareTo, dateError]);
  const { result, reload } = useAdminData(load);
  const groupLabel = { category: "カテゴリ", organizer: "主催者", format: "開催形式" }[groupBy];
  return (
    <>
      <AdminPageHeader title="基本集計" description="月別の開催・参加状況と、指標別のランキングを確認できます。" />
      <div className={styles.content}>
        <form action="/admin/analytics" method="get" className={`${styles.filters} ${styles.analyticsFilters}`}>
          <label>開始日（JST）<input name="from" type="date" defaultValue={from} required /></label>
          <label>終了日（JST）<input name="to" type="date" defaultValue={to} required /></label>
          <label>集計軸<select name="groupBy" defaultValue={groupBy}>
            <option value="category">カテゴリ</option><option value="organizer">主催者</option><option value="format">開催形式</option>
          </select></label>
          <label>順位の指標<select name="metric" defaultValue={metric}>
            {Object.entries(METRIC_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>比較開始日（任意・JST）<input name="compareFrom" type="date" defaultValue={compareFrom} /></label>
          <label>比較終了日（任意・JST）<input name="compareTo" type="date" defaultValue={compareTo} /></label>
          <button type="submit" className={styles.primary}>集計する</button>
        </form>
        {result.status === "loading" && <AdminDataState />}
        {result.status === "error" && <AdminDataState message={result.message} reload={dateError ? undefined : reload} />}
        {result.status === "ready" && <>
          <MetricsTable title={`月別の開催・参加状況（${from} 〜 ${to}）`} label="開催月" rows={result.data.monthly.map((row) => ({ ...row, id: row.month, name: row.month }))} />
          {result.data.comparison && <MetricsTable title={`比較期間の開催・参加状況（${compareFrom} 〜 ${compareTo}）`}
            label="開催月" rows={result.data.comparison.map((row) => ({ ...row, id: row.month, name: row.month }))} />}
          <MetricsTable title={`${groupLabel}別の内訳（${METRIC_LABELS[metric]}順・上位10件）`} label={groupLabel} showRate
            rows={result.data.groups.map((row) => ({ ...row, id: row.groupId, name: groupBy === "format" ? FORMAT_LABELS[row.groupName] ?? row.groupName : row.groupName }))} />
        </>}
      </div>
    </>
  );
}

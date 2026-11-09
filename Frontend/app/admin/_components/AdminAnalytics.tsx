"use client";

import { useCallback } from "react";
import { apiRequest } from "@/app/_lib/api";
import { useAdminData } from "../_lib/use-admin-data";
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

export default function AdminAnalytics({ from, to, groupBy }: {
  from: string; to: string; groupBy: "category" | "organizer" | "format";
}) {
  const load = useCallback(async (signal: AbortSignal) => {
    if (from > to) throw new Error("終了日を開始日以降にしてください。");
    const query = new URLSearchParams({ from, to });
    const breakdown = new URLSearchParams({ from, to, groupBy, metric: "registrations", limit: "10" });
    const [monthly, groups] = await Promise.all([
      apiRequest<{ data: Month[] }>(`/admin/analytics/monthly-participants?${query}`, { signal }),
      apiRequest<{ data: Group[] }>(`/admin/analytics/breakdown?${breakdown}`, { signal }),
    ]);
    return { monthly: monthly.data, groups: groups.data };
  }, [from, to, groupBy]);
  const { result, reload } = useAdminData(load);
  const groupLabel = { category: "カテゴリ", organizer: "主催者", format: "開催形式" }[groupBy];
  return (
    <>
      <AdminPageHeader title="基本集計" description="開催数・参加者の推移と、申込数順の内訳を確認できます。" />
      <div className={styles.content}>
        <form action="/admin/analytics" method="get" className={`${styles.filters} ${styles.analyticsFilters}`}>
          <label>開始日（JST）<input name="from" type="date" defaultValue={from} required /></label>
          <label>終了日（JST）<input name="to" type="date" defaultValue={to} required /></label>
          <label>集計軸<select name="groupBy" defaultValue={groupBy}>
            <option value="category">カテゴリ</option><option value="organizer">主催者</option><option value="format">開催形式</option>
          </select></label>
          <button type="submit" className={styles.primary}>集計する</button>
        </form>
        {result.status === "loading" && <AdminDataState />}
        {result.status === "error" && <AdminDataState message={result.message} reload={from <= to ? reload : undefined} />}
        {result.status === "ready" && <>
          <MetricsTable title="月別の開催・参加状況" label="開催月" rows={result.data.monthly.map((row) => ({ ...row, id: row.month, name: row.month }))} />
          <MetricsTable title={`${groupLabel}別の内訳（申込数順・上位10件）`} label={groupLabel} showRate
            rows={result.data.groups.map((row) => ({ ...row, id: row.groupId, name: groupBy === "format" ? FORMAT_LABELS[row.groupName] ?? row.groupName : row.groupName }))} />
        </>}
      </div>
    </>
  );
}

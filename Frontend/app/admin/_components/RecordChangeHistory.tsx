"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/app/_lib/api";
import type { PageResult } from "@/app/_lib/api";
import { historySummary } from "../_lib/change-history";
import type { Change } from "../_lib/change-history";
import { formatDate, SECTIONS } from "../_lib/records";
import type { RecordSection } from "../_lib/records";
import { useAdminData } from "../_lib/use-admin-data";
import AdminDataState from "./AdminDataState";
import styles from "../admin.module.css";

const CHANGE_LABELS: Record<string, string> = {
  created: "作成", updated: "編集", status_changed: "状態変更",
  reviewed: "確認済み", "organizer.updated": "組織情報の編集",
};
function ChangeHistoryRows({ section, id }: { section: RecordSection; id: string }) {
  const [page, setPage] = useState(1);
  const load = useCallback(
    (signal: AbortSignal) => apiRequest<PageResult<Change>>(
      `/admin/${section}/${encodeURIComponent(id)}/history?page=${page}&perPage=20`, { signal },
    ),
    [section, id, page],
  );
  const { result, reload } = useAdminData(load);
  if (result.status === "loading") return <AdminDataState />;
  if (result.status === "error") return <AdminDataState message={result.message} reload={reload} />;
  const { data, pagination } = result.data;
  const lastPage = Math.max(1, Math.ceil(pagination.total / pagination.perPage));
  return (
    <>
      {data.length === 0 ? <AdminDataState message="このページに変更履歴はありません。" /> : (
        <div className={styles.tableScroll} role="region" aria-label="変更履歴の表" tabIndex={0}>
          <table className={styles.table}>
            <thead><tr>
              <th scope="col">日時（JST）</th><th scope="col">変更</th>
              <th scope="col">内容</th><th scope="col">実行者 ID</th>
            </tr></thead>
            <tbody>{data.map((row) => {
              const action = row.changeType ?? row.action ?? (row.toStatus ? "status_changed" : "—");
              const statuses: Record<string, string> = SECTIONS[section].statuses;
              return <tr key={row.id}>
                <th scope="row"><time dateTime={row.createdAt}>{formatDate(row.createdAt)}</time></th>
                <td>{CHANGE_LABELS[action] ?? statuses[action] ?? action}</td>
                <td>{historySummary(section, row) || "—"}</td>
                <td className={styles.actor}><code title={row.actorUserId ?? undefined}>{row.actorUserId ?? "—"}</code></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
      {lastPage > 1 && <div className={styles.pagination}>
        <span>{page} / {lastPage} ページ</span>
        <nav aria-label="変更履歴のページ切り替え">
          {page > 1 && <button className={styles.button} type="button" onClick={() => setPage(page - 1)}>前へ</button>}
          {page < lastPage && <button className={styles.button} type="button" onClick={() => setPage(page + 1)}>次へ</button>}
        </nav>
      </div>}
    </>
  );
}

export default function RecordChangeHistory({ section, id }: { section: RecordSection; id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <details className={styles.card} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className={styles.historySummary}>対象の変更履歴</summary>
      {isOpen && <ChangeHistoryRows key={id} section={section} id={id} />}
    </details>
  );
}

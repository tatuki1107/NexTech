"use client";

import Link from "next/link";
import { useCallback } from "react";
import { getApiQuery } from "../_lib/filters";
import {
  actionLabel,
  formatDate,
  getHistory,
  SECTIONS,
  TARGET_SECTIONS,
} from "../_lib/records";
import { useAdminData } from "../_lib/use-admin-data";
import AdminDataState from "./AdminDataState";
import AdminFilters from "./AdminFilters";
import AdminPageHeader from "./AdminPageHeader";
import AdminPagination from "./AdminPagination";
import styles from "../admin.module.css";

export default function HistoryList({ filters }: { filters: string }) {
  const query = getApiQuery(filters);
  const load = useCallback(
    (signal: AbortSignal) => getHistory(query, signal),
    [query],
  );
  const { result, reload } = useAdminData(load);
  return (
    <>
      <AdminPageHeader
        title="操作履歴"
        description="管理者が行った運営対応と確認済み記録を確認できます。"
      />
      <div className={styles.content}>
        <AdminFilters key={filters} section="history" filters={filters} />
        <section
          className={styles.card}
          aria-labelledby="admin-history-results"
        >
          <div className={styles.cardHeading}>
            <div>
              <h2 id="admin-history-results">対応記録</h2>
              {result.status === "ready" && (
                <p role="status">{result.data.pagination.total} 件</p>
              )}
            </div>
          </div>
          {result.status === "loading" && <AdminDataState />}
          {result.status === "error" && (
            <AdminDataState message={result.message} reload={reload} />
          )}
          {result.status === "ready" && (
            <>
              {result.data.data.length === 0 ? (
                <AdminDataState message="このページに表示する対応記録はありません。" />
              ) : (
                <>
                  <p className={styles.tableHint}>
                    表は横にスクロールできます。
                  </p>
                  <div
                    className={styles.tableScroll}
                    tabIndex={0}
                    role="region"
                    aria-label="操作履歴"
                  >
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          {[
                            "操作日時（JST）",
                            "対象種別",
                            "操作",
                            "理由・記録",
                            "実行者 ID",
                          ].map((name) => (
                            <th key={name} scope="col">
                              {name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.data.map((row) => {
                          const section = TARGET_SECTIONS[row.targetType];
                          return (
                            <tr key={row.id}>
                              <th scope="row">
                                <time dateTime={row.createdAt}>
                                  {formatDate(row.createdAt)}
                                </time>
                              </th>
                              <td>
                                <Link
                                  className={styles.textLink}
                                  href={`/admin/${section}/${row.targetId}`}
                                  aria-label={`${SECTIONS[section].label}の詳細を開く（${row.targetId}）`}
                                >
                                  {SECTIONS[section].label}
                                </Link>
                              </td>
                              <td>{actionLabel(row)}</td>
                              <td>{row.reason || "—"}</td>
                              <td className={styles.actor}>
                                <code title={row.actorUserId ?? undefined}>
                                  {row.actorUserId || "—"}
                                </code>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <AdminPagination
                section="history"
                filters={filters}
                pagination={result.data.pagination}
                count={result.data.data.length}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}

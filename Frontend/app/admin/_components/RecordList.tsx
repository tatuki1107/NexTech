"use client";

import Link from "next/link";
import { useCallback } from "react";
import { getApiQuery, getListHref } from "../_lib/filters";
import { listRecords, SECTIONS } from "../_lib/records";
import type { RecordSection } from "../_lib/records";
import { useAdminData } from "../_lib/use-admin-data";
import AdminDataState from "./AdminDataState";
import AdminFilters from "./AdminFilters";
import AdminPageHeader from "./AdminPageHeader";
import AdminPagination from "./AdminPagination";
import { EventPreview } from "./RecordDetails";
import RecordStatus from "./RecordStatus";
import styles from "../admin.module.css";

export default function RecordList({
  section,
  filters,
  previewId,
}: {
  section: RecordSection;
  filters: string;
  previewId?: string;
}) {
  const spec = SECTIONS[section];
  const query = getApiQuery(filters);
  const load = useCallback(
    (signal: AbortSignal) => listRecords(section, query, signal),
    [section, query],
  );
  const { result, reload } = useAdminData(load);
  return (
    <>
      <AdminPageHeader title={spec.title} description={spec.description} />
      <div className={previewId ? styles.split : undefined}>
        <div className={styles.content}>
          <AdminFilters key={filters} section={section} filters={filters} />
          <section
            className={styles.card}
            aria-labelledby="admin-record-results"
          >
            <div className={styles.cardHeading}>
              <div>
                <h2 id="admin-record-results">検索結果</h2>
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
                  <AdminDataState message="このページに表示する結果はありません。" />
                ) : (
                  <>
                    <p className={styles.tableHint}>
                      表は横にスクロールできます。
                    </p>
                    <div
                      className={styles.tableScroll}
                      tabIndex={0}
                      role="region"
                      aria-label={spec.title}
                    >
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            {spec.columns.map((column, index) => (
                              <th
                                key={column}
                                scope="col"
                                className={
                                  previewId && index > 0
                                    ? styles.hideInPreview
                                    : undefined
                                }
                              >
                                {column}
                              </th>
                            ))}
                            <th scope="col">状態</th>
                            <th scope="col" aria-label="詳細" />
                          </tr>
                        </thead>
                        <tbody>
                          {result.data.data.map((row) => {
                            const detail = `/admin/${section}/${row.id}${filters ? `?${filters}` : ""}`;
                            const selected = previewId === row.id;
                            return (
                              <tr
                                key={row.id}
                                data-selected={selected || undefined}
                              >
                                <th scope="row">{row.title}</th>
                                <td
                                  className={
                                    previewId ? styles.hideInPreview : undefined
                                  }
                                >
                                  {row.columns[0]}
                                </td>
                                <td
                                  className={
                                    previewId ? styles.hideInPreview : undefined
                                  }
                                >
                                  {row.columns[1]}
                                </td>
                                <td>
                                  <RecordStatus
                                    section={section}
                                    status={row.status}
                                  />
                                </td>
                                <td>
                                  <div className={styles.rowActions}>
                                    {section === "events" && (
                                      <Link
                                        className={
                                          selected
                                            ? styles.primary
                                            : styles.button
                                        }
                                        href={getListHref(section, filters, {
                                          preview: row.id,
                                        })}
                                        scroll={false}
                                        aria-current={
                                          selected ? "true" : undefined
                                        }
                                        aria-label={`${row.title}の概要を表示`}
                                      >
                                        概要
                                      </Link>
                                    )}
                                    {!previewId && (
                                      <Link
                                        className={styles.button}
                                        href={detail}
                                        aria-label={`${row.title}の詳細を見る`}
                                      >
                                        詳細を見る
                                      </Link>
                                    )}
                                  </div>
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
                  section={section}
                  filters={filters}
                  pagination={result.data.pagination}
                  count={result.data.data.length}
                />
              </>
            )}
          </section>
        </div>
        {previewId && <EventPreview id={previewId} filters={filters} />}
      </div>
    </>
  );
}

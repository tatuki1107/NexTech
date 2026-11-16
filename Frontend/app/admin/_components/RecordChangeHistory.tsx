"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/app/_lib/api";
import type { PageResult } from "@/app/_lib/api";
import { formatDate, SECTIONS } from "../_lib/records";
import type { RecordSection } from "../_lib/records";
import { useAdminData } from "../_lib/use-admin-data";
import AdminDataState from "./AdminDataState";
import styles from "../admin.module.css";

type Change = {
  id: string;
  actorUserId: string | null;
  createdAt: string;
  action?: string;
  reason?: string | null;
  changeType?: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: { before?: unknown; after?: unknown; fromStatus?: string; status?: string } | null;
  fromStatus?: string | null;
  toStatus?: string;
};

const CHANGE_LABELS: Record<string, string> = {
  created: "作成", updated: "編集", status_changed: "状態変更",
  reviewed: "確認済み", "organizer.updated": "組織情報の編集",
};
const FIELDS: Record<string, string> = {
  title: "イベント名", summary: "概要", description: "説明",
  category_id: "カテゴリ", format: "開催形式", venue_name: "会場",
  start_at: "開始日時", end_at: "終了日時", capacity: "定員",
  name: "組織名", slug: "識別名", contact_email: "連絡先", website_url: "Webサイト",
  application_start_at: "申込開始日時", application_deadline: "申込締切",
  waitlist_enabled: "キャンセル待ち", participation_conditions: "参加条件",
};

function readSnapshot(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function historySummary(section: RecordSection, row: Change) {
  const before = readSnapshot(row.beforeData ?? row.metadata?.before);
  const after = readSnapshot(row.afterData ?? row.metadata?.after);
  const statuses: Record<string, string> = SECTIONS[section].statuses;
  const from = row.fromStatus ?? row.metadata?.fromStatus ?? before.status;
  const to = row.toStatus ?? row.metadata?.status ?? after.status;
  const statusLabel = (value: unknown) => typeof value === "string" ? statuses[value] ?? value : "—";
  const transition = typeof to === "string" && from !== to
    ? `${statusLabel(from)} → ${statusLabel(to)}` : "";
  const fields = Object.entries(FIELDS)
    .filter(([key]) => {
      if (!Object.hasOwn(before, key)) return false;
      // Event edits log the SQL row before the edit and the API patch after it.
      const apiKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
      const afterKey = Object.hasOwn(after, key) ? key : apiKey;
      if (!Object.hasOwn(after, afterKey)) return false;
      const oldValue = before[key];
      const newValue = after[afterKey];
      if (key.endsWith("_at") || key === "application_deadline") {
        if (typeof oldValue === "string" && typeof newValue === "string") {
          const oldTime = Date.parse(oldValue);
          return Number.isFinite(oldTime) ? oldTime !== Date.parse(newValue) : oldValue !== newValue;
        }
      }
      return oldValue !== newValue;
    })
    .map(([, label]) => label);
  if (row.changeType === "updated" && Object.hasOwn(after, "tagIds")) fields.push("タグ");
  const reason = row.reason ?? after.reason;
  return [transition, fields.join("、"), typeof reason === "string" ? reason : ""]
    .filter(Boolean).join(" / ");
}

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

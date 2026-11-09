"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getListHref } from "../_lib/filters";
import {
  actionLabel,
  formatDate,
  getHistory,
  getRecord,
  SECTIONS,
} from "../_lib/records";
import type { AdminRecord, RecordSection } from "../_lib/records";
import { useAdminData } from "../_lib/use-admin-data";
import AdminDataState from "./AdminDataState";
import AdminPageHeader from "./AdminPageHeader";
import RecordStatus from "./RecordStatus";
import RecordOperations from "./RecordOperations";
import styles from "../admin.module.css";

function RecordFields({ fields }: { fields: AdminRecord["fields"] }) {
  return (
    <dl className={styles.fields}>
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecentHistory({
  section,
  id,
  preview,
}: {
  section: RecordSection;
  id: string;
  preview: boolean;
}) {
  const filters = new URLSearchParams({
    targetType: SECTIONS[section].target,
    targetId: id,
  });
  const href = getListHref("history", filters.toString());
  filters.set("perPage", preview ? "1" : "3");
  const query = filters.toString();
  const load = useCallback(
    (signal: AbortSignal) => getHistory(query, signal),
    [query],
  );
  const { result, reload } = useAdminData(load);
  return (
    <section className={preview ? styles.previewHistory : styles.card}>
      <div className={styles.cardHeading}>
        <h2>最近の運営対応</h2>
        {!preview && (
          <Link className={styles.button} href={href}>
            対象の操作履歴を見る
          </Link>
        )}
      </div>
      {result.status === "loading" && <AdminDataState />}
      {result.status === "error" && (
        <AdminDataState message={result.message} reload={reload} />
      )}
      {result.status === "ready" &&
        (result.data.data.length === 0 ? (
          <AdminDataState message="運営対応の記録はありません。" />
        ) : (
          <ul className={styles.recentList}>
            {result.data.data.map((row) => (
              <li key={row.id}>
                <strong>{actionLabel(row)}</strong>
                {row.reason && <p>{row.reason}</p>}
                <time dateTime={row.createdAt}>
                  {formatDate(row.createdAt)} JST
                </time>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}

function RecordContent({
  section,
  id,
  preview = false,
}: {
  section: RecordSection;
  id: string;
  preview?: boolean;
}) {
  const load = useCallback(
    (signal: AbortSignal) => getRecord(section, id, signal),
    [section, id],
  );
  const { result, reload } = useAdminData(load);
  const [notice, setNotice] = useState("");
  if (result.status === "loading") return <AdminDataState />;
  if (result.status === "error") {
    const message =
      result.code === 404 ? "対象が見つかりませんでした。" : result.message;
    return (
      <AdminDataState
        message={message}
        reload={result.code === 404 ? undefined : reload}
      />
    );
  }
  const record = result.data;
  return (
    <>
      {notice && <p role="status">{notice}</p>}
      <section
        className={
          preview ? styles.previewIntro : `${styles.card} ${styles.recordIntro}`
        }
      >
        <div>
          <h2>{record.title}</h2>
          <p>
            ID <code>{record.id}</code>
          </p>
        </div>
        <RecordStatus section={section} status={record.status} />
      </section>
      <section className={preview ? styles.previewFields : styles.card}>
        <div className={styles.cardHeading}>
          <h2>基本情報</h2>
        </div>
        <RecordFields fields={record.fields} />
      </section>
      {!preview && <RecordOperations section={section} record={record} onChanged={(message) => {
        setNotice(message);
        reload();
      }} />}
      <RecentHistory section={section} id={id} preview={preview} />
    </>
  );
}

export function RecordDetails({
  section,
  id,
  filters,
}: {
  section: RecordSection;
  id: string;
  filters: string;
}) {
  const spec = SECTIONS[section];
  return (
    <>
      <AdminPageHeader
        title={spec.detail}
        description={`管理者 / ${spec.title} / ${spec.detail}`}
      />
      <div className={styles.content}>
        <Link href={getListHref(section, filters)} className={styles.textLink}>
          ← {spec.title}に戻る
        </Link>
        <RecordContent section={section} id={id} />
      </div>
    </>
  );
}

export function EventPreview({ id, filters }: { id: string; filters: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [id]);
  return (
    <aside className={styles.preview} aria-labelledby="admin-event-preview">
      <div className={styles.previewHeading}>
        <h2 id="admin-event-preview" ref={heading} tabIndex={-1}>
          イベント詳細
        </h2>
        <Link
          className={styles.button}
          aria-label="イベント詳細を閉じる"
          href={getListHref("events", filters)}
          scroll={false}
        >
          ×
        </Link>
      </div>
      <RecordContent section="events" id={id} preview />
      <footer className={styles.previewFooter}>
        <Link
          href={`/admin/events/${id}${filters ? `?${filters}` : ""}`}
          className={styles.primary}
        >
          イベント詳細を開く →
        </Link>
      </footer>
    </aside>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiRequest, errorMessage } from "@/app/_lib/api";
import type { AdminRecord } from "../_lib/records";
import { getListHref } from "../_lib/filters";
import styles from "../admin.module.css";

export function EventSuspensionButton({ record, onSuspended }: {
  record: AdminRecord;
  onSuspended: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError("公開停止の理由を入力してください。");
      return;
    }
    setError("");
    submitting.current = true;
    setBusy(true);
    try {
      await apiRequest(`/admin/events/${encodeURIComponent(record.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "draft", reason: cleanReason }),
      });
      dialog.current?.close();
      onSuspended();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={styles.button} aria-haspopup="dialog" onClick={() => {
        setReason("");
        setError("");
        dialog.current?.showModal();
      }}>公開停止</button>
      <dialog ref={dialog} className={styles.suspensionDialog} aria-labelledby="event-suspension-title"
        aria-describedby="event-suspension-impact" onCancel={(event) => {
          if (submitting.current) event.preventDefault();
        }}>
        <form onSubmit={submit} method="post" className={styles.suspensionForm}>
          <div className={styles.warningIcon}><Image src="/icons/figma-flow/warning.svg" width={27} height={27} alt="" /></div>
          <h2 id="event-suspension-title">イベントを公開停止しますか？</h2>
          <p id="event-suspension-impact">参加者から閲覧できなくなります。イベント情報と申込履歴は保持し、対応理由と実行者を記録します。</p>
          <div className={styles.suspensionTarget}>
            <strong>{record.title}</strong>
            {record.fields.slice(1).map(([label, value]) => <p key={label}>{label}　{value}</p>)}
          </div>
          <label className={styles.suspensionReason}>対応理由（必須）
            <textarea name="reason" required maxLength={1000} rows={2} value={reason} disabled={busy}
              placeholder="掲載ガイドライン違反の疑い" onChange={(event) => setReason(event.target.value)} />
          </label>
          {error && <p role="alert" className={styles.suspensionError}>{error}</p>}
          <div className={styles.suspensionActions}>
            <button type="button" className={styles.suspensionSecondary} disabled={busy}
              onClick={() => dialog.current?.close()}>キャンセル</button>
            <button type="submit" className={styles.suspensionDanger} disabled={busy}>
              {busy ? "処理中…" : "公開停止を実行"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function EventSuspensionComplete({ id, title, filters }: {
  id: string;
  title: string;
  filters: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const historyQuery = new URLSearchParams({targetType:"event", targetId:id}).toString();
  return (
    <section className={styles.suspensionComplete} aria-labelledby="suspension-complete-title">
      <div className={styles.successIcon}><Image src="/icons/figma-flow/success.svg" width={27} height={27} alt="" /></div>
      <h2 id="suspension-complete-title" tabIndex={-1} ref={heading}>イベントを公開停止しました</h2>
      <p>参加者向けの公開を停止し、操作履歴へ記録しました。</p>
      <p className={styles.suspensionSummary}>{title}</p>
      <div className={styles.suspensionActions}>
        <Link className={styles.suspensionSecondary} href={getListHref("history", historyQuery)}>操作履歴を見る</Link>
        <Link className={styles.primary} href={getListHref("events", filters)}>イベント一覧へ</Link>
      </div>
    </section>
  );
}

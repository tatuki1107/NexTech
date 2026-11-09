"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { apiRequest, errorMessage } from "@/app/_lib/api";
import { SECTIONS } from "../_lib/records";
import type { AdminRecord, RecordSection } from "../_lib/records";
import styles from "../admin.module.css";

type Action = { label: string; status?: string };
const REVIEW: Action = { label: "確認済みを記録" };

export default function RecordOperations({
  section, record, onChanged,
}: {
  section: RecordSection;
  record: AdminRecord;
  onChanged: (message: string) => void;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const statusAction = section === "events"
    ? record.status === "published" ? { label: "公開停止", status: "draft" }
      : record.status === "draft" ? { label: "公開・復帰", status: "published" } : null
    : section === "organizers"
      ? record.status === "active" ? { label: "主催者を停止", status: "suspended" }
        : { label: "主催者を復帰", status: "active" }
      : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || busy) return;
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    if (action.status && !reason) {
      setError("状態を変更する理由を入力してください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (action.status) {
        await apiRequest(`/admin/${section}/${encodeURIComponent(record.id)}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: action.status, reason }),
        });
      } else {
        await apiRequest("/admin/reviews", {
          method: "POST",
          body: JSON.stringify({ targetType: SECTIONS[section].target, targetId: record.id, reason: reason || undefined }),
        });
      }
      onChanged(action.status ? `${action.label}を実行しました。` : "確認済みとして記録しました。");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeading}><h2>運営操作</h2></div>
      <div className={styles.operationForm}>
        {!action ? (
          <div className={styles.rowActions}>
            {[REVIEW, ...(statusAction ? [statusAction] : [])].map((option) => (
              <button key={option.label} type="button" className={styles.button} onClick={() => setAction(option)}>{option.label}</button>
            ))}
          </div>
        ) : (
          <form method="post" onSubmit={submit}>
            <p><strong>{record.title}</strong>：{action.label}</p>
            <label>理由（{action.status ? "必須" : "任意"}）
              <textarea name="reason" maxLength={1000} required={Boolean(action.status)} disabled={busy} rows={3} />
            </label>
            {error && <p role="alert">{error}</p>}
            <div className={styles.rowActions}>
              <button type="submit" className={styles.primary} disabled={busy}>{busy ? "処理中…" : "実行する"}</button>
              <button type="button" className={styles.button} disabled={busy} onClick={() => { setAction(null); setError(""); }}>戻る</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { changeStatus, errorMessage, type ManagedEvent } from "../../_lib/api";
import type { OrganizerEvent } from "../_lib/event";
import { CARD_BUTTON } from "../_lib/card-button";
import ConfirmDialog from "./ConfirmDialog";
export default function EventManagementActions({
  event,
  onChanged,
}: {
  event: OrganizerEvent;
  onChanged: () => void;
}) {
  const [target, setTarget] = useState<ManagedEvent["status"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const labels = {
    published: "公開",
    draft: "公開停止",
    cancelled: "開催中止",
    completed: "開催完了",
  };
  async function confirm() {
    if (!target || busy) return;
    setBusy(true);
    setError("");
    try {
      await changeStatus(event.id, target);
      setTarget(null);
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/organizer/event-management/${event.id}`}
          className={CARD_BUTTON.brand}
        >
          詳細
        </Link>
        {event.status !== "cancelled" && (
          <>
            <Link
              href={`/organizer/event-management/${event.id}/edit`}
              className={CARD_BUTTON.neutral}
            >
              編集
            </Link>
            {event.status === "draft" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setTarget("published")}
                className={CARD_BUTTON.success}
              >
                公開
              </button>
            ) : (
              event.status === "published" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setTarget("draft")}
                    className={CARD_BUTTON.neutral}
                  >
                    公開停止
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setTarget("completed")}
                    className={CARD_BUTTON.neutral}
                  >
                    開催完了
                  </button>
                </>
              )
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => setTarget("cancelled")}
              className={CARD_BUTTON.danger}
            >
              開催中止
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      <ConfirmDialog
        isOpen={target !== null}
        title={target ? labels[target] + "しますか？" : ""}
        description={
          target === "cancelled"
            ? "開催中止は元に戻せません。申込者に通知されます。履歴は保持されます。"
            : "イベントの状態を変更します。"
        }
        confirmLabel={busy ? "処理中…" : "変更する"}
        cancelLabel="戻る"
        onConfirm={confirm}
        onCancel={() => {
          if (!busy) setTarget(null);
        }}
      />
    </div>
  );
}

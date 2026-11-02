"use client";

import { useState } from "react";

import ConfirmDialog from "../../event-management/_components/ConfirmDialog";
import type { Participant } from "../_lib/acceptance";
import AcceptanceStatCard from "./AcceptanceStatCard";
import ParticipantTable from "./ParticipantTable";

type AcceptancePanelProps = {
  initialParticipants: Participant[];
};

const CONTROL_CLASS =
  "h-14 rounded-xl border border-ol-neutral-primary bg-white text-base text-fg-neutral-primary placeholder:text-fg-neutral-secondary focus:outline-2 focus:outline-fg-brand-primary";

export default function AcceptancePanel({
  initialParticipants,
}: AcceptancePanelProps) {
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);
  const [undoTargetId, setUndoTargetId] = useState<string | null>(null);

  const appliedCount = participants.length;
  const checkedInCount = participants.filter(
    (participant) => participant.isCheckedIn,
  ).length;
  const undoTarget = participants.find(
    (participant) => participant.id === undoTargetId,
  );

  // 受付の保存はAPI接続のPRで実装。今は画面内の状態だけを切り替える
  const updateCheckIn = (id: string, isCheckedIn: boolean) => {
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === id ? { ...participant, isCheckedIn } : participant,
      ),
    );
  };

  const handleConfirmUndo = () => {
    if (undoTargetId) updateCheckIn(undoTargetId, false);
    setUndoTargetId(null);
  };

  return (
    <div className="space-y-8">
      <div className="grid w-187 grid-cols-3 gap-6">
        <AcceptanceStatCard label="申込" value={appliedCount} />
        <AcceptanceStatCard label="受付済み" value={checkedInCount} />
        <AcceptanceStatCard
          label="未受付"
          value={appliedCount - checkedInCount}
        />
      </div>

      {/* 検索・並び替え・絞り込みは見た目のみ。動作は別PRで実装 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-neutral-secondary"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            aria-label="氏名または申込番号で検索"
            placeholder="氏名または申込番号で検索"
            className={`${CONTROL_CLASS} w-full pl-12 pr-4`}
          />
        </div>
        <div className="relative">
          {/* 五十音順は読み仮名のデータが必要。API側の対応後に実装 */}
          <select
            aria-label="並び替え"
            className={`${CONTROL_CLASS} w-45 appearance-none pr-6 text-center`}
          >
            <option>五十音順</option>
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-neutral-primary"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <button
          type="button"
          aria-label="絞り込み"
          className="flex h-14 w-14 items-center justify-center rounded-xl text-fg-neutral-primary hover:bg-bg-neutral-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
          </svg>
        </button>
      </div>

      <ParticipantTable
        participants={participants}
        onCheckIn={(id) => updateCheckIn(id, true)}
        onRequestUndo={setUndoTargetId}
      />

      <ConfirmDialog
        isOpen={undoTarget !== undefined}
        title="受付を取り消しますか?"
        description={
          undoTarget ? `${undoTarget.name}さんの受付を取り消します。` : ""
        }
        confirmLabel="取り消す"
        cancelLabel="キャンセル"
        onConfirm={handleConfirmUndo}
        onCancel={() => setUndoTargetId(null)}
      />
    </div>
  );
}

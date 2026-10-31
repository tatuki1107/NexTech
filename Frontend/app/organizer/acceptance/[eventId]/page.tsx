import Link from "next/link";

import AcceptancePanel from "../_components/AcceptancePanel";
import type { Participant } from "../_lib/acceptance";

// 仮データ。APIができたら、URLのeventIdで取得したイベントと参加者に置き換える
const EVENT = { id: "1", title: "React UI設計ワークショップ" };

const participants: Participant[] = [
  {
    id: "1",
    name: "鈴木 健太",
    nameKana: "すずき けんた",
    requestNumber: "#TC-034",
    isCheckedIn: false,
  },
  {
    id: "2",
    name: "佐藤 花子",
    nameKana: "さとう はなこ",
    requestNumber: "#TC-035",
    isCheckedIn: false,
  },
  {
    id: "3",
    name: "田中 美咲",
    nameKana: "たなか みさき",
    requestNumber: "#TC-036",
    isCheckedIn: true,
  },
  {
    id: "4",
    name: "伊藤 拓海",
    nameKana: "いとう たくみ",
    requestNumber: "#TC-037",
    isCheckedIn: false,
  },
  {
    id: "5",
    name: "高橋 葵",
    nameKana: "たかはし あおい",
    requestNumber: "#TC-038",
    isCheckedIn: false,
  },
  {
    id: "6",
    name: "渡辺 翔",
    nameKana: "わたなべ しょう",
    requestNumber: "#TC-039",
    isCheckedIn: true,
  },
  {
    id: "7",
    name: "山本 結衣",
    nameKana: "やまもと ゆい",
    requestNumber: "#TC-040",
    isCheckedIn: false,
  },
  {
    id: "8",
    name: "中村 蓮",
    nameKana: "なかむら れん",
    requestNumber: "#TC-041",
    isCheckedIn: false,
  },
];

export default function AcceptanceDetailPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/organizer/acceptance"
          className="flex w-fit items-center gap-2 text-base font-bold text-fg-neutral-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          当日受付に戻る
        </Link>
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-3xl font-bold text-fg-neutral-primary">
            {EVENT.title}
          </h1>
          <Link
            href={`/organizer/event-management/${EVENT.id}`}
            className="flex h-14 shrink-0 items-center rounded-xl border border-ol-neutral-primary bg-white px-6 text-sm font-bold text-fg-neutral-primary"
          >
            イベント詳細へ
          </Link>
        </div>
      </div>

      <AcceptancePanel initialParticipants={participants} />
    </div>
  );
}

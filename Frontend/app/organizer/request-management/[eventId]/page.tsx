import Link from "next/link";

import ApplicantTable from "../_components/ApplicantTable";
import SummaryCard from "../_components/SummaryCard";
import type { Applicant } from "../_lib/request";

// 仮データ。APIができたら、URLのeventIdで取得したイベントに置き換える
const EVENT_TITLE = "React UI設計ワークショップ";

const applicants: Applicant[] = [
  {
    id: "1",
    name: "鈴木 健太",
    email: "kenta@example.jp",
    requestNumber: "#TC-034",
    appliedAt: "5/18 12:42",
    status: "applied",
  },
  {
    id: "2",
    name: "佐藤 花子",
    email: "hanako@example.jp",
    requestNumber: "#TC-035",
    appliedAt: "5/18 13:08",
    status: "cancelled",
  },
  {
    id: "3",
    name: "田中 美咲",
    email: "misaki@example.jp",
    requestNumber: "#TC-036",
    appliedAt: "5/19 09:15",
    status: "applied",
  },
  {
    id: "4",
    name: "伊藤 拓海",
    email: "takumi@example.jp",
    requestNumber: "#TC-037",
    appliedAt: "5/19 10:31",
    status: "applied",
  },
  {
    id: "5",
    name: "高橋 葵",
    email: "aoi@example.jp",
    requestNumber: "#TC-038",
    appliedAt: "5/20 16:02",
    status: "cancelled",
  },
  {
    id: "6",
    name: "高橋 葵",
    email: "aoi@example.jp",
    requestNumber: "#TC-038",
    appliedAt: "5/20 16:02",
    status: "cancelled",
  },
  {
    id: "7",
    name: "高橋 葵",
    email: "aoi@example.jp",
    requestNumber: "#TC-038",
    appliedAt: "5/20 16:02",
    status: "cancelled",
  },
];

const appliedCount = applicants.filter(
  (applicant) => applicant.status === "applied",
).length;
const waitlistedCount = applicants.filter(
  (applicant) => applicant.status === "waitlisted",
).length;
const cancelledCount = applicants.filter(
  (applicant) => applicant.status === "cancelled",
).length;

const SEARCH_CLASS =
  "h-14 rounded-xl border border-ol-neutral-primary bg-white px-4 text-base text-fg-neutral-primary placeholder:text-fg-neutral-secondary focus:outline-2 focus:outline-fg-brand-primary";

export default function ApplicantListPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/organizer/request-management"
          className="flex w-fit items-center gap-2 text-sm text-fg-neutral-secondary"
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
          申込管理に戻る
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-fg-neutral-primary">
            {EVENT_TITLE}
          </h1>
          <p className="mt-2 text-xs text-fg-neutral-secondary">申込者一覧</p>
        </div>
      </div>

      <div className="grid w-187 grid-cols-3 gap-6">
        <SummaryCard label="申込" value={String(appliedCount)} />
        <SummaryCard label="キャンセル待ち" value={String(waitlistedCount)} />
        <SummaryCard label="キャンセル" value={String(cancelledCount)} />
      </div>

      {/* 検索とCSVエクスポートは見た目のみ。動作は別PRで実装 */}
      <div className="flex gap-4">
        <input
          type="search"
          aria-label="氏名・メール・申込番号で検索"
          placeholder="氏名・メール・申込番号で検索"
          className={`${SEARCH_CLASS} flex-1`}
        />
        <button
          type="button"
          className="h-14 w-50 rounded-xl border-2 border-fg-brand-primary bg-white text-base font-bold text-fg-brand-primary"
        >
          CSVエクスポート
        </button>
      </div>

      <ApplicantTable applicants={applicants} />
    </div>
  );
}

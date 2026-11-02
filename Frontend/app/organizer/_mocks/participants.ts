// API接続までの仮データ。各画面をAPIに置き換えたら、該当するデータを削除する
import type { Participant } from "../acceptance/_lib/acceptance";
import type { Applicant } from "../request-management/_lib/request";

/** 申込管理: 申込者一覧 */
export const MOCK_APPLICANTS: Applicant[] = [
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

/** 当日受付: 参加者 */
export const MOCK_ACCEPTANCE_PARTICIPANTS: Participant[] = [
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
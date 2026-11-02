// API接続までの仮データ。各画面をAPIに置き換えたら、該当するデータを削除する
import type { NextEvent } from "../_components/dashboard/NextEventCard";
import type { AcceptanceEvent } from "../acceptance/_lib/acceptance";
import type { OrganizerEvent } from "../event-management/_lib/event";
import type { EventDetail } from "../event-management/_lib/event-detail";
import type { EventFormValues } from "../event-management/_lib/event-form";
import type { EventRequestSummary } from "../request-management/_lib/request";

/** ダッシュボード: 次の開催 */
export const MOCK_NEXT_EVENT: NextEvent = {
  title: "React UI設計ワークショップ",
  schedule: "2026/06/14(土) 13:00 - 16:00　名古屋 / オンライン",
  applied: 32,
  capacity: 40,
  attendanceRate: 87,
};

/** イベント管理: 一覧 */
export const MOCK_EVENTS: OrganizerEvent[] = [
  {
    id: "1",
    title: "React UI設計ワークショップ",
    status: "published",
    schedule: "6/14(土) 13:00 - 16:00",
    venue: "名古屋 / オンライン",
    applied: 30,
    capacity: 30,
    waitlisted: 2,
  },
  {
    id: "2",
    title: "LLMアプリ開発入門",
    status: "published",
    schedule: "6/21(土) 18:30 - 20:00",
    venue: "オンライン",
    applied: 32,
    capacity: 40,
    waitlisted: 0,
  },
  {
    id: "3",
    title: "TypeScript入門ハンズオン",
    status: "published",
    schedule: "6/28(土) 10:00 - 12:00",
    venue: "名古屋",
    applied: 30,
    capacity: 45,
    waitlisted: 0,
  },
  {
    id: "4",
    title: "Next.js実践ワークショップ",
    status: "draft",
    schedule: "7/5(土) 13:00 - 16:00",
    venue: "名古屋 / オンライン",
    applied: 0,
    capacity: 40,
    waitlisted: 0,
  },
  {
    id: "5",
    title: "春のフロントエンド交流会",
    status: "ended",
    schedule: "5/10(土) 13:00 - 16:00",
    venue: "名古屋・会場開催",
    applied: 40,
    capacity: 40,
    waitlisted: 0,
  },
];

/** イベント管理: 詳細 */
export const MOCK_EVENT_DETAIL: EventDetail = {
  id: "1",
  title: "React UI設計ワークショップ",
  status: "published",
  schedule: "2026/06/14(土) 13:00 - 16:00",
  venue: "名古屋 / オンライン",
  capacity: 40,
  tags: ["フロントエンド", "初心者向け"],
  description:
    "コンポーネント設計とアクセシビリティの基礎を、演習形式で学びます。\n実際のUIを題材に、再利用しやすい設計とレビュー方法を身につけます。",
  publishPeriod: "2026/05/01 12:00 〜 2026/06/12 23:59",
  lastUpdated: "2026/05/01 17:30　山田 太郎",
  applied: 32,
  waitlisted: 0,
  checkedIn: 16,
};

/** イベント管理: 編集フォームの初期値 */
export const MOCK_EDIT_FORM_VALUES: EventFormValues = {
  title: "React UI設計ワークショップ",
  date: "2026-06-14",
  startTime: "13:00",
  endTime: "16:00",
  venue: "名古屋",
  venueUrl: "",
  capacity: "40",
  tags: ["フロントエンド", "生成AI"],
  description: "Reactを使ったUI設計の考え方を、ハンズオンで学びます。",
};

/** イベント管理: 編集画面の最終更新 */
export const MOCK_EDIT_LAST_UPDATED = "2026/05/01 17:30　山田太郎";

/** 申込管理: イベント別の申込状況 */
export const MOCK_REQUEST_SUMMARIES: EventRequestSummary[] = [
  {
    id: "1",
    title: "React UI設計ワークショップ",
    schedule: "6/14(土) 13:00",
    status: "published",
    applied: 32,
    waitlisted: 0,
  },
  {
    id: "2",
    title: "LLMアプリ開発入門",
    schedule: "6/21(土) 18:30",
    status: "full",
    applied: 40,
    waitlisted: 12,
  },
  {
    id: "3",
    title: "デザインシステム実践講座",
    schedule: "6/28(土) 10:00",
    status: "published",
    applied: 28,
    waitlisted: 2,
  },
  {
    id: "4",
    title: "TypeScript設計レビュー会",
    schedule: "7/05(土) 14:00",
    status: "draft",
    applied: 18,
    waitlisted: 4,
  },
  {
    id: "5",
    title: "キャリア相談ミートアップ",
    schedule: "7/12(土) 19:00",
    status: "draft",
    applied: 10,
    waitlisted: 0,
  },
];

/** 申込管理: 申込者一覧のイベント名 */
export const MOCK_APPLICANT_EVENT_TITLE = "React UI設計ワークショップ";

/** 当日受付: 本日開催のイベント */
export const MOCK_TODAY_EVENTS: AcceptanceEvent[] = [
  {
    id: "1",
    title: "React UI設計ワークショップ",
    status: "published",
    schedule: "6/14(土) 13:00 - 16:00",
    venue: "名古屋 / オンライン",
    applied: 32,
    capacity: 40,
    waitlisted: 0,
    checkedIn: 10,
  },
  {
    id: "2",
    title: "LLMアプリ開発入門",
    status: "published",
    schedule: "6/14(土) 18:30 - 20:00",
    venue: "オンライン",
    applied: 40,
    capacity: 40,
    waitlisted: 12,
    checkedIn: 0,
  },
];

/** 当日受付: 受付画面のイベント */
export const MOCK_ACCEPTANCE_EVENT = {
  id: "1",
  title: "React UI設計ワークショップ",
};
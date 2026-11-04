// API接続までの仮データ。各画面をAPIに置き換えたら、該当するデータを削除する
import type { Account } from "../_lib/account";
import type {
  Member,
  NotificationSetting,
  Organization,
} from "../settings/_lib/settings";

/** サイドバー: 切り替えられるアカウント */
export const MOCK_ACCOUNTS: Account[] = [
  { id: "yamada", name: "山田 太郎", role: "主催者アカウント" },
  { id: "sato", name: "佐藤 二郎", role: "主催者アカウント" },
  { id: "suzuki", name: "鈴木 花子", role: "主催者アカウント" },
];

/** 設定: 組織情報 */
export const MOCK_ORGANIZATION: Organization = {
  name: "株式会社シップス",
  teamName: "NexTech運営チーム",
  organizerId: "ORG-00042",
  profileUrl: "https://nextech.jp/organizers/ships",
  logoUrl: null,
};

/** 設定: メンバー */
export const MOCK_MEMBERS: Member[] = [
  {
    id: "1",
    name: "山田 太郎",
    email: "yamada@nextech.jp",
    role: "admin",
    status: "active",
    avatarUrl: null,
  },
  {
    id: "2",
    name: "佐藤 花子",
    email: "sato@nextech.jp",
    role: "editor",
    status: "active",
    avatarUrl: null,
  },
  {
    id: "3",
    name: "鈴木 健太",
    email: "suzuki@nextech.jp",
    role: "staff",
    status: "invited",
    avatarUrl: null,
  },
];

/** 設定: 通知設定 */
export const MOCK_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "new-request",
    title: "新しい申込",
    description: "申込が入ったときに通知",
    isEnabled: true,
  },
  {
    id: "waitlist-change",
    title: "キャンセル・待機順位の変更",
    description: "対応が必要な状態変更を通知",
    isEnabled: true,
  },
  {
    id: "weekly-report",
    title: "週次レポート",
    description: "毎週月曜にサマリーを配信",
    isEnabled: false,
  },
];
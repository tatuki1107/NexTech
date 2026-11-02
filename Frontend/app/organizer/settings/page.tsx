import MemberList from "./_components/MemberList";
import NotificationSettings from "./_components/NotificationSettings";
import OrganizationCard from "./_components/OrganizationCard";
import SecurityCard from "./_components/SecurityCard";
import type {
  Member,
  NotificationSetting,
  Organization,
} from "./_lib/settings";

// 仮データ。APIができたら、ログイン中の組織の情報に置き換える
const organization: Organization = {
  name: "株式会社シップス",
  teamName: "NexTech運営チーム",
  organizerId: "ORG-00042",
  profileUrl: "https://nextech.jp/organizers/ships",
  logoUrl: null,
};

const members: Member[] = [
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

const notificationSettings: NotificationSetting[] = [
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

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-fg-neutral-primary">設定</h1>
        <p className="mt-2 text-xs text-fg-neutral-secondary">
          組織情報・メンバー・通知を管理します
        </p>
      </header>

      <OrganizationCard organization={organization} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-fg-neutral-primary">
            メンバー
          </h2>
          {/* メンバーの招待は別PRで実装 */}
          <button
            type="button"
            className="flex h-12 items-center gap-2 rounded-xl bg-fg-brand-primary px-8 text-sm font-bold text-fg-inverse-primary"
          >
            <span aria-hidden="true">＋</span>
            メンバーを招待
          </button>
        </div>
        <MemberList members={members} />
      </section>

      <div className="grid grid-cols-[2fr_1fr] items-start gap-6">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-fg-neutral-primary">
            通知設定
          </h2>
          <NotificationSettings initialSettings={notificationSettings} />
        </section>
        <div className="pt-11">
          <SecurityCard isTwoFactorEnabled />
        </div>
      </div>
    </div>
  );
}

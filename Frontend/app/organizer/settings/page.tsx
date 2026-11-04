import {
  MOCK_MEMBERS,
  MOCK_NOTIFICATION_SETTINGS,
  MOCK_ORGANIZATION,
} from "../_mocks/organization";
import MemberList from "./_components/MemberList";
import NotificationSettings from "./_components/NotificationSettings";
import OrganizationCard from "./_components/OrganizationCard";
import SecurityCard from "./_components/SecurityCard";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-fg-neutral-primary">設定</h1>
        <p className="mt-2 text-xs text-fg-neutral-secondary">
          組織情報・メンバー・通知を管理します
        </p>
      </header>

      <OrganizationCard organization={MOCK_ORGANIZATION} />

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
        <MemberList members={MOCK_MEMBERS} />
      </section>

      <div className="grid grid-cols-[2fr_1fr] items-start gap-6">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-fg-neutral-primary">
            通知設定
          </h2>
          <NotificationSettings initialSettings={MOCK_NOTIFICATION_SETTINGS} />
        </section>
        <div className="pt-11">
          <SecurityCard isTwoFactorEnabled />
        </div>
      </div>
    </div>
  );
}

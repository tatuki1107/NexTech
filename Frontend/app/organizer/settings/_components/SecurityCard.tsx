import DetailCard from "../../event-management/_components/detail/DetailCard";

type SecurityCardProps = {
  isTwoFactorEnabled: boolean;
};

const LINK_BUTTON =
  "text-sm font-bold text-fg-brand-primary underline-offset-4 hover:underline";

export default function SecurityCard({
  isTwoFactorEnabled,
}: SecurityCardProps) {
  return (
    <DetailCard title="セキュリティ">
      {/* 各操作は別PRで実装 */}
      <ul className="space-y-6">
        <li>
          <button
            type="button"
            className="text-sm font-bold text-fg-neutral-primary hover:underline"
          >
            パスワードを変更
          </button>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-sm font-bold text-fg-neutral-primary">
            二段階認証
          </span>
          <span
            className={`text-sm font-bold ${
              isTwoFactorEnabled
                ? "text-fg-accent-green"
                : "text-fg-neutral-secondary"
            }`}
          >
            {isTwoFactorEnabled ? "有効" : "無効"}
          </span>
        </li>
        <li>
          <button type="button" className={LINK_BUTTON}>
            組織データのエクスポート
          </button>
        </li>
      </ul>
    </DetailCard>
  );
}

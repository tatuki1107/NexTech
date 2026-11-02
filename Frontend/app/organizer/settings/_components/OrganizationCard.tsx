import type { Organization } from "../_lib/settings";
import Avatar from "./Avatar";

type OrganizationCardProps = {
  organization: Organization;
};

export default function OrganizationCard({
  organization,
}: OrganizationCardProps) {
  return (
    <section
      aria-label="組織情報"
      className="rounded-xl border border-ol-neutral-primary bg-white p-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-6">
          <Avatar
            imageUrl={organization.logoUrl}
            fallbackText={organization.teamName.charAt(0)}
            shape="square"
            sizeClassName="h-22 w-22"
            fallbackClassName="bg-bg-accent-blue text-4xl font-bold text-fg-brand-primary"
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-fg-neutral-primary">
              {organization.name}
            </h2>
            <p className="text-sm text-fg-neutral-secondary">
              {organization.teamName}
            </p>
            <p className="text-xs text-fg-neutral-secondary">
              イベント主催者ID：{organization.organizerId}
            </p>
          </div>
        </div>
        {/* 組織情報の編集は別PRで実装 */}
        <button
          type="button"
          className="flex h-12 w-45 shrink-0 items-center justify-center rounded-xl border-2 border-fg-brand-primary bg-white text-sm font-bold text-fg-brand-primary"
        >
          組織情報を編集
        </button>
      </div>

      <dl className="mt-6 flex items-center gap-8">
        <dt className="w-40 shrink-0 text-sm font-bold text-fg-neutral-primary">
          公開プロフィール
        </dt>
        <dd>
          <a
            href={organization.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-fg-brand-primary underline-offset-4 hover:underline"
          >
            {organization.profileUrl}
          </a>
        </dd>
      </dl>
    </section>
  );
}

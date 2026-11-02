import Avatar from "./Avatar";

import {
  MEMBER_ROLE_LABELS,
  MEMBER_STATUS_LABELS,
  type Member,
} from "../_lib/settings";

type MemberListProps = {
  members: Member[];
};

export default function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-ol-neutral-primary bg-white p-8 text-center text-sm text-fg-neutral-secondary">
        メンバーがいません。「メンバーを招待」から追加できます。
      </p>
    );
  }

  return (
    <ul className="rounded-xl border border-ol-neutral-primary bg-white">
      {members.map((member) => (
        <li
          key={member.id}
          className="grid grid-cols-[1fr_15rem_15rem_3rem] items-center gap-4 border-t border-ol-neutral-primary px-5 py-4 first:border-t-0"
        >
          <div className="flex items-center gap-4">
            <Avatar
              imageUrl={member.avatarUrl}
              fallbackText={member.name.charAt(0)}
              shape="circle"
              sizeClassName="h-12 w-12"
              fallbackClassName="bg-bg-neutral-primary text-base font-bold text-fg-neutral-secondary"
            />
            <div>
              <p className="text-base font-bold text-fg-neutral-primary">
                {member.name}
              </p>
              <p className="mt-1 text-xs text-fg-neutral-secondary">
                {member.email}
              </p>
            </div>
          </div>
          <p className="text-sm text-fg-neutral-primary">
            {MEMBER_ROLE_LABELS[member.role]}
          </p>
          <p
            className={`text-sm font-bold ${
              member.status === "active"
                ? "text-fg-accent-green"
                : "text-fg-neutral-secondary"
            }`}
          >
            {MEMBER_STATUS_LABELS[member.status]}
          </p>
          {/* 権限変更・削除などのメニューは別PRで実装 */}
          <button
            type="button"
            aria-label={`${member.name}の操作`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-fg-neutral-secondary hover:bg-bg-neutral-primary"
          >
            <span aria-hidden="true">•••</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

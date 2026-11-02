export type Organization = {
  name: string;
  teamName: string;
  organizerId: string;
  profileUrl: string;
  logoUrl: string | null;
};

export type MemberRole = "admin" | "editor" | "staff";
export type MemberStatus = "active" | "invited";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  avatarUrl: string | null;
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  admin: "管理者",
  editor: "編集者",
  staff: "受付担当",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "有効",
  invited: "招待中",
};

export type NotificationSetting = {
  id: string;
  title: string;
  description: string;
  isEnabled: boolean;
};
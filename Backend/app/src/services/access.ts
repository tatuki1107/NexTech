import { sqlClient } from "../db";
import type { CurrentUser } from "../lib/auth";
import { forbidden, notFound } from "../lib/errors";

export const canManageOrganizer = async (user: CurrentUser, organizerId: string): Promise<boolean> => {
  if (user.roles.includes("admin")) return true;
  const rows = await sqlClient`SELECT 1 FROM organizers o WHERE o.id=${organizerId}
    AND (o.owner_user_id=${user.id} OR EXISTS (SELECT 1 FROM organizer_members m WHERE m.organizer_id=o.id AND m.user_id=${user.id}))`;
  return rows.length > 0;
};

export const requireOrganizerAccess = async (user: CurrentUser, organizerId: string): Promise<void> => {
  if (!(await canManageOrganizer(user, organizerId))) throw forbidden();
};

export const requireEventAccess = async (user: CurrentUser, eventId: string): Promise<{ organizerId: string }> => {
  const rows = await sqlClient`SELECT organizer_id AS "organizerId" FROM events WHERE id=${eventId}`;
  if (!rows[0]) throw notFound("イベントが見つかりません");
  const event = rows[0] as { organizerId: string };
  await requireOrganizerAccess(user, event.organizerId);
  return event;
};

export const requireActiveOrganizer = async (organizerId: string): Promise<void> => {
  const [organizer] = await sqlClient`SELECT status FROM organizers WHERE id=${organizerId}`;
  if (!organizer) throw notFound("主催者が見つかりません");
  if (organizer.status !== "active") throw forbidden("停止中の主催者はイベントを操作できません");
};

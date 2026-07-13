import { sqlClient } from "../db";
import type { CurrentUser } from "../lib/auth";
import { forbidden, notFound } from "../lib/errors";

export const canManageOrganizer = async (user: CurrentUser, organizerId: string): Promise<boolean> => {
  if (user.roles.includes("admin")) return true;
  const rows = await sqlClient`SELECT 1 FROM organizer_members WHERE organizer_id=${organizerId} AND user_id=${user.id}`;
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

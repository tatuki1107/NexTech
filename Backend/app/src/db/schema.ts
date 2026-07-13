import {
  boolean,
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  fullName: varchar("full_name", { length: 120 }),
  profileText: text("profile_text"),
  avatarUrl: text("avatar_url"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
});

export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleCode: varchar("role_code", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.roleCode] })]);

export const organizers = pgTable("organizers", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  websiteUrl: text("website_url"),
  contactEmail: varchar("contact_email", { length: 255 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  ...timestamps,
});

export const organizerMembers = pgTable("organizer_members", {
  organizerId: uuid("organizer_id").references(() => organizers.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  memberRole: varchar("member_role", { length: 20 }).default("member").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.organizerId, table.userId] })]);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  ...timestamps,
});

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizerId: uuid("organizer_id").references(() => organizers.id).notNull(),
  categoryId: uuid("category_id").references(() => categories.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  summary: varchar("summary", { length: 300 }),
  description: text("description").notNull(),
  format: varchar("format", { length: 20 }).notNull(),
  venueName: varchar("venue_name", { length: 160 }),
  address: text("address"),
  onlineUrl: text("online_url"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Tokyo").notNull(),
  capacity: integer("capacity").notNull(),
  waitlistEnabled: boolean("waitlist_enabled").default(false).notNull(),
  applicationStartAt: timestamp("application_start_at", { withTimezone: true }),
  applicationDeadline: timestamp("application_deadline", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  visibility: varchar("visibility", { length: 20 }).default("public").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  version: integer("version").default(1).notNull(),
  ...timestamps,
}, (table) => [
  index("events_public_search_idx").on(table.status, table.startAt),
  index("events_category_idx").on(table.categoryId),
  index("events_organizer_idx").on(table.organizerId),
]);

export const eventTags = pgTable("event_tags", {
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  tagId: uuid("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (table) => [primaryKey({ columns: [table.eventId, table.tagId] })]);

export const registrations = pgTable("registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  waitlistPosition: integer("waitlist_position"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  cancellationReason: varchar("cancellation_reason", { length: 255 }),
  checkinNote: varchar("checkin_note", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
}, (table) => [
  uniqueIndex("registrations_active_user_event_idx").on(table.eventId, table.userId).where(sql`${table.status} <> 'cancelled'`),
  uniqueIndex("registrations_waitlist_position_idx").on(table.eventId, table.waitlistPosition).where(sql`${table.status} = 'waitlisted'`),
  index("registrations_event_status_idx").on(table.eventId, table.status),
]);

export const registrationStatusHistories = pgTable("registration_status_histories", {
  id: uuid("id").defaultRandom().primaryKey(),
  registrationId: uuid("registration_id").references(() => registrations.id).notNull(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  fromStatus: varchar("from_status", { length: 20 }),
  toStatus: varchar("to_status", { length: 20 }).notNull(),
  changedByUserId: uuid("changed_by_user_id").references(() => users.id),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userFavoriteOrganizers = pgTable("user_favorite_organizers", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizerId: uuid("organizer_id").references(() => organizers.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.organizerId] })]);

export const userFavoriteCategories = pgTable("user_favorite_categories", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.categoryId] })]);

export const eventChangeLogs = pgTable("event_change_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  changedByUserId: uuid("changed_by_user_id").references(() => users.id).notNull(),
  changeType: varchar("change_type", { length: 30 }).notNull(),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const moderationActions = pgTable("moderation_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id).notNull(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetId: uuid("target_id").notNull(),
  action: varchar("action", { length: 30 }).notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const operationLogs = pgTable("operation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: uuid("resource_id"),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  familyId: uuid("family_id").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  replacedById: uuid("replaced_by_id"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  userAgent: text("user_agent"),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("auth_sessions_family_idx").on(table.familyId)]);

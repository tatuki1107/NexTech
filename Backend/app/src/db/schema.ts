import {
    sql
    } from "drizzle-orm";

import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
    primaryKey,
    inet,
    jsonb,
    check,
    } from "drizzle-orm/pg-core";

    export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        email: varchar("email", { length: 254 }).notNull(),        passwordHash: varchar("password_hash", { length: 255 }).notNull(),
        displayName: varchar("display_name", { length: 100 }).notNull(),
        fullName: varchar("full_name", { length: 100 }),
        profileText: text("profile_text"),
        avatarUrl: text("avatar_url"),
        status: varchar("status", { length: 32 }).notNull().default("active"),
        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
        uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
        check(
            "users_status_valid",
            sql`${table.status} in ('active', 'inactive', 'suspended')`,
        ),
    ],
    );

    export const organizers = pgTable(
    "organizers",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        ownerUserId: uuid("owner_user_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
        name: varchar("name", { length: 100 }).notNull(),
        slug: varchar("slug", { length: 100 }).notNull(),
        description: text("description"),
        websiteUrl: text("website_url"),
        contactEmail: varchar("contact_email", { length: 254 }),
        status: varchar("status", { length: 32 }).notNull().default("active"),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
        uniqueIndex("organizers_slug_unique").on(table.slug),
        index("organizers_owner_user_id_index").on(table.ownerUserId),
        check(
            "organizers_status_valid",
            sql`${table.status} in ('active', 'inactive', 'suspended')`,
        ),
    ],
    );

    export const categories = pgTable(
    "categories",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: varchar("name", { length: 100 }).notNull(),
        slug: varchar("slug", { length: 100 }).notNull(),
        description: text("description"),
        displayOrder: integer("display_order").notNull().default(0),
        status: varchar("status", { length: 32 }).notNull().default("active"),
        createdBy: uuid("created_by").references(() => users.id, {
        onDelete: "set null",
        }),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
        uniqueIndex("categories_slug_unique").on(table.slug),
        check(
            "categories_status_valid",
            sql`${table.status} in ('active', 'inactive')`,
        ),
    ],
    );

    export const tags = pgTable(
    "tags",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: varchar("name", { length: 100 }).notNull(),
        slug: varchar("slug", { length: 100 }).notNull(),
        createdBy: uuid("created_by").references(() => users.id, {
        onDelete: "set null",
        }),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [uniqueIndex("tags_slug_unique").on(table.slug)],
    );

    export const events = pgTable(
    "events",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        organizerId: uuid("organizer_id")
        .notNull()
        .references(() => organizers.id, { onDelete: "restrict" }),
        categoryId: uuid("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "restrict" }),
        createdBy: uuid("created_by")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
        title: varchar("title", { length: 200 }).notNull(),
        summary: varchar("summary", { length: 500 }),
        description: text("description").notNull(),
        format: varchar("format", { length: 32 }).notNull(),
        venueName: varchar("venue_name", { length: 200 }),
        address: text("address"),
        onlineUrl: text("online_url"),
        startAt: timestamp("start_at", { withTimezone: true }).notNull(),
        endAt: timestamp("end_at", { withTimezone: true }).notNull(),
        timezone: varchar("timezone", { length: 64 }).notNull(),
        capacity: integer("capacity").notNull(),
        waitlistEnabled: boolean("waitlist_enabled").notNull().default(false),
        applicationStartAt: timestamp("application_start_at", {
        withTimezone: true,
        }),
        applicationDeadline: timestamp("application_deadline", {
        withTimezone: true,
        }),
        status: varchar("status", { length: 32 }).notNull().default("draft"),
        visibility: varchar("visibility", { length: 32 })
        .notNull()
        .default("public"),
        publishedAt: timestamp("published_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
        version: integer("version").notNull().default(1),
    },
    (table) => [
        index("events_organizer_id_index").on(table.organizerId),
        index("events_category_id_index").on(table.categoryId),
        index("events_start_at_index").on(table.startAt),
        index("events_status_visibility_start_at_index").on(
            table.status,
            table.visibility,
            table.startAt,
        ),
        check("events_capacity_positive", sql`${table.capacity} > 0`),
        check(
            "events_format_valid",
            sql`${table.format} in ('online', 'offline', 'hybrid')`,
        ),
        check(
            "events_status_valid",
            sql`${table.status} in ('draft', 'published', 'cancelled', 'completed')`,
        ),
        check(
            "events_visibility_valid",
            sql`${table.visibility} in ('public', 'private', 'unlisted')`,
        ),
        check(
            "events_format_location_valid",
            sql`(
                (${table.format} = 'online' and nullif(trim(${table.onlineUrl}), '') is not null)
                or (${table.format} = 'offline' and nullif(trim(${table.venueName}), '') is not null)
                or (
                    ${table.format} = 'hybrid'
                    and nullif(trim(${table.onlineUrl}), '') is not null
                    and nullif(trim(${table.venueName}), '') is not null
                )
            )`,
        ),
        check("events_time_order", sql`${table.endAt} > ${table.startAt}`),
        check(
            "events_application_deadline_before_start",
            sql`${table.applicationDeadline} IS NULL OR ${table.applicationDeadline} <= ${table.startAt}`,
        ),
        check(
            "events_application_window_order",
            sql`${table.applicationStartAt} IS NULL OR ${table.applicationDeadline} IS NULL OR ${table.applicationStartAt} <= ${table.applicationDeadline}`,
        ),
        check("events_version_positive", sql`${table.version} >= 1`),
    ],
);

    export const userRoles = pgTable(
        "user_roles",
        {
            userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
            roleCode: varchar("role_code", { length: 32 }).notNull(),
            createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        },
        (table) => [
            primaryKey({ columns: [table.userId, table.roleCode] }),
            check(
                "user_roles_role_code_valid",
                sql`${table.roleCode} in ('participant', 'organizer', 'admin')`,
            ),
        ],
    );

    export const organizerMembers = pgTable(
        "organizer_members",
        {
            organizerId: uuid("organizer_id")
            .notNull()
            .references(() => organizers.id, { onDelete: "restrict" }),
            userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
            memberRole: varchar("member_role", { length: 32 })
            .notNull()
            .default("member"),
            createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        },
        (table) => [
            primaryKey({ columns: [table.organizerId, table.userId] }),
            index("organizer_members_user_id_index").on(table.userId),
            check(
                "organizer_members_member_role_valid",
                sql`${table.memberRole} in ('owner', 'admin', 'member')`,
            ),
        ],
    );

    export const eventTags = pgTable(
        "event_tags",
        {
            eventId: uuid("event_id")
            .notNull()
            .references(() => events.id, { onDelete: "cascade" }),
            tagId: uuid("tag_id")
            .notNull()
            .references(() => tags.id, { onDelete: "restrict" }),
        },
        (table) => [
            primaryKey({ columns: [table.eventId, table.tagId] }),
            index("event_tags_tag_id_index").on(table.tagId),
        ],
    );

    export const registrations = pgTable(
        "registrations",
        {
            id: uuid("id").defaultRandom().primaryKey(),
            eventId: uuid("event_id")
            .notNull()
            .references(() => events.id, { onDelete: "restrict" }),
            userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
            status: varchar("status", { length: 32 }).notNull().default("pending"),
            waitlistPosition: integer("waitlist_position"),
            appliedAt: timestamp("applied_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
            confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
            cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
            checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
            cancellationReason: varchar("cancellation_reason", { length: 500 }),
            checkinNote: varchar("checkin_note", { length: 500 }),
            updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
            version: integer("version").notNull().default(1),
        },
        (table) => [
            uniqueIndex("registrations_event_user_unique").on(      //DBレベルで同一ユーザの同一イベントへの重複登録を防ぐ
            table.eventId,
            table.userId,
            ),
            uniqueIndex("registrations_waitlist_position_unique")
                .on(table.eventId, table.waitlistPosition)
                .where(sql`${table.status} = 'waitlisted'`),
            index("registrations_event_status_index").on(table.eventId, table.status),
            index("registrations_user_id_index").on(table.userId),
            check(
                "registrations_waitlist_position_positive",
                sql`${table.waitlistPosition} IS NULL OR ${table.waitlistPosition} > 0`,
            ),
            check(
                "registrations_status_valid",
                sql`${table.status} in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in', 'no_show')`,
            ),
            check("registrations_version_positive", sql`${table.version} >= 1`),
        ],
    );

    export const registrationStatusHistories = pgTable(
        "registration_status_histories",
        {
            id: uuid("id").defaultRandom().primaryKey(),
            registrationId: uuid("registration_id")
            .notNull()
            .references(() => registrations.id, { onDelete: "restrict" }),
            fromStatus: varchar("from_status", { length: 32 }),
            toStatus: varchar("to_status", { length: 32 }).notNull(),
            changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
            onDelete: "set null",
            }),
            reason: varchar("reason", { length: 500 }),
            createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        },
        (table) => [
            index("registration_status_histories_registration_created_at_index").on(
                table.registrationId,
                table.createdAt,
            ),
            check(
                "registration_status_histories_from_status_valid",
                sql`${table.fromStatus} is null or ${table.fromStatus} in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in', 'no_show')`,
            ),
            check(
                "registration_status_histories_to_status_valid",
                sql`${table.toStatus} in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in', 'no_show')`,
            ),
        ],
    );
    export const userFavoriteOrganizers = pgTable(
    "user_favorite_organizers",
    {
        userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
        organizerId: uuid("organizer_id")
        .notNull()
        .references(() => organizers.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
        primaryKey({ columns: [table.userId, table.organizerId] }),
        index("user_favorite_organizers_organizer_id_index").on(
        table.organizerId,
        ),
    ],
    );

    export const userFavoriteCategories = pgTable(
    "user_favorite_categories",
    {
        userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
        categoryId: uuid("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
        primaryKey({ columns: [table.userId, table.categoryId] }),
        index("user_favorite_categories_category_id_index").on(
        table.categoryId,
        ),
    ],
    );

    export const eventChangeLogs = pgTable(
    "event_change_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        eventId: uuid("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "restrict" }),
        changedByUserId: uuid("changed_by_user_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
        changeType: varchar("change_type", { length: 32 }).notNull(),
        beforeData: jsonb("before_data").$type<Record<string, unknown>>(),
        afterData: jsonb("after_data").$type<Record<string, unknown>>(),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
        index("event_change_logs_event_created_at_index").on(
        table.eventId,
        table.createdAt,
        ),
    ],
    );

    export const moderationActions = pgTable(
    "moderation_actions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        actorUserId: uuid("actor_user_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
        targetType: varchar("target_type", { length: 32 }).notNull(),
        targetId: uuid("target_id").notNull(),
        action: varchar("action", { length: 32 }).notNull(),
        reason: text("reason"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>(),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
        index("moderation_actions_target_index").on(
        table.targetType,
        table.targetId,
        ),
    ],
    );

    export const operationLogs = pgTable(
    "operation_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        actorUserId: uuid("actor_user_id").references(() => users.id, {
        onDelete: "set null",
        }),
        action: varchar("action", { length: 64 }).notNull(),
        resourceType: varchar("resource_type", { length: 32 }).notNull(),
        resourceId: uuid("resource_id"),
        ipAddress: inet("ip_address"),
        userAgent: text("user_agent"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>(),
        createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
        index("operation_logs_resource_index").on(
        table.resourceType,
        table.resourceId,
        ),
        index("operation_logs_actor_created_at_index").on(
        table.actorUserId,
        table.createdAt,
        ),
    ],
    );

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

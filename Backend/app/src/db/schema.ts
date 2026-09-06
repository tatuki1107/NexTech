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
    } from "drizzle-orm/pg-core";

    export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        email: varchar("email", { length: 254 }).notNull(),
        passwordHash: varchar("password_hash", { length: 255 }).notNull(),
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
    (table) => [uniqueIndex("users_email_unique").on(table.email)],
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
    (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
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
            index("registrations_event_status_index").on(table.eventId, table.status),
            index("registrations_user_id_index").on(table.userId),
        ],
    );

    export const registrationStatusHistories = pgTable(
        "registration_status_histories",
        {
            id: uuid("id").defaultRandom().primaryKey(),
            registrationId: uuid("registration_id")
            .notNull()
            .references(() => registrations.id, { onDelete: "restrict" }),
            eventId: uuid("event_id")
            .notNull()
            .references(() => events.id, { onDelete: "restrict" }),
            userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
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
            index("registration_status_histories_registration_id_index").on(
            table.registrationId,
            ),
        ],
    );
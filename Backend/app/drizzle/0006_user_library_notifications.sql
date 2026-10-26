CREATE TABLE "user_notification_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"registration_updates" boolean DEFAULT true NOT NULL,
	"event_reminders" boolean DEFAULT true NOT NULL,
	"recommendations" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid,
	"kind" varchar(32) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_notifications_kind_valid" CHECK ("user_notifications"."kind" in ('registration', 'reminder', 'recommendation'))
);
--> statement-breakpoint
CREATE TABLE "user_saved_events" (
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_saved_events_user_id_event_id_pk" PRIMARY KEY("user_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_events" ADD CONSTRAINT "user_saved_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_events" ADD CONSTRAINT "user_saved_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_notifications_dedupe_idx" ON "user_notifications" USING btree ("user_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "user_notifications_user_created_idx" ON "user_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_saved_events_event_idx" ON "user_saved_events" USING btree ("event_id");
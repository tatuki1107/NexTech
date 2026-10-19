ALTER TABLE "events" ADD COLUMN "participation_requirements" text;--> statement-breakpoint
ALTER TABLE "registration_status_histories" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "registration_status_histories" ADD COLUMN "user_id" uuid;--> statement-breakpoint
UPDATE "registration_status_histories" h SET "event_id"=r.event_id,"user_id"=r.user_id FROM "registrations" r WHERE r.id=h.registration_id;--> statement-breakpoint
ALTER TABLE "registration_status_histories" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "registration_status_histories" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "registration_status_histories" ADD CONSTRAINT "registration_status_histories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_status_histories" ADD CONSTRAINT "registration_status_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
UPDATE event_change_logs SET before_data=(before_data #>> '{}')::jsonb WHERE jsonb_typeof(before_data)='string';--> statement-breakpoint
UPDATE event_change_logs SET after_data=(after_data #>> '{}')::jsonb WHERE jsonb_typeof(after_data)='string';--> statement-breakpoint
UPDATE moderation_actions SET metadata=(metadata #>> '{}')::jsonb WHERE jsonb_typeof(metadata)='string';

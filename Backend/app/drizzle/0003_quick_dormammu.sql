ALTER TABLE "registration_status_histories" DROP CONSTRAINT "registration_status_histories_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "registration_status_histories" DROP CONSTRAINT "registration_status_histories_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "registration_status_histories_registration_id_index";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
CREATE INDEX "events_status_visibility_start_at_index" ON "events" USING btree ("status","visibility","start_at");--> statement-breakpoint
CREATE INDEX "registration_status_histories_registration_created_at_index" ON "registration_status_histories" USING btree ("registration_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_waitlist_position_unique" ON "registrations" USING btree ("event_id","waitlist_position") WHERE "registrations"."status" = 'waitlisted';--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
ALTER TABLE "registration_status_histories" DROP COLUMN "event_id";--> statement-breakpoint
ALTER TABLE "registration_status_histories" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_capacity_positive" CHECK ("events"."capacity" > 0);--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_time_order" CHECK ("events"."end_at" > "events"."start_at");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_application_deadline_before_start" CHECK ("events"."application_deadline" IS NULL OR "events"."application_deadline" <= "events"."start_at");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_application_window_order" CHECK ("events"."application_start_at" IS NULL OR "events"."application_deadline" IS NULL OR "events"."application_start_at" <= "events"."application_deadline");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_version_positive" CHECK ("events"."version" >= 1);--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_waitlist_position_positive" CHECK ("registrations"."waitlist_position" IS NULL OR "registrations"."waitlist_position" > 0);--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_version_positive" CHECK ("registrations"."version" >= 1);
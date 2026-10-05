ALTER TABLE "categories" ADD CONSTRAINT "categories_status_valid" CHECK ("categories"."status" in ('active', 'inactive'));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_format_valid" CHECK ("events"."format" in ('online', 'offline', 'hybrid'));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_status_valid" CHECK ("events"."status" in ('draft', 'published', 'cancelled', 'completed'));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_visibility_valid" CHECK ("events"."visibility" in ('public', 'private', 'unlisted'));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_format_location_valid" CHECK ((
                ("events"."format" = 'online' and nullif(trim("events"."online_url"), '') is not null)
                or ("events"."format" = 'offline' and nullif(trim("events"."venue_name"), '') is not null)
                or (
                    "events"."format" = 'hybrid'
                    and nullif(trim("events"."online_url"), '') is not null
                    and nullif(trim("events"."venue_name"), '') is not null
                )
            ));--> statement-breakpoint
ALTER TABLE "organizer_members" ADD CONSTRAINT "organizer_members_member_role_valid" CHECK ("organizer_members"."member_role" in ('owner', 'admin', 'member'));--> statement-breakpoint
ALTER TABLE "organizers" ADD CONSTRAINT "organizers_status_valid" CHECK ("organizers"."status" in ('active', 'inactive', 'suspended'));--> statement-breakpoint
ALTER TABLE "registration_status_histories" ADD CONSTRAINT "registration_status_histories_from_status_valid" CHECK ("registration_status_histories"."from_status" is null or "registration_status_histories"."from_status" in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in', 'no_show'));--> statement-breakpoint
ALTER TABLE "registration_status_histories" ADD CONSTRAINT "registration_status_histories_to_status_valid" CHECK ("registration_status_histories"."to_status" in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in', 'no_show'));--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_status_valid" CHECK ("registrations"."status" in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in', 'no_show'));--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_code_valid" CHECK ("user_roles"."role_code" in ('participant', 'organizer', 'admin'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_status_valid" CHECK ("users"."status" in ('active', 'inactive', 'suspended'));
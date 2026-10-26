ALTER TABLE "events" DROP CONSTRAINT "events_format_location_valid";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "format" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "start_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "capacity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "participation_conditions" text;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_publish_fields_required" CHECK ("events"."status" not in ('published', 'completed') or (
                "events"."category_id" is not null and "events"."format" is not null
                and "events"."start_at" is not null and "events"."end_at" is not null
                and "events"."capacity" is not null
            ));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_format_location_valid" CHECK ("events"."status" in ('draft', 'cancelled') or (
                ("events"."format" = 'online' and nullif(trim("events"."online_url"), '') is not null)
                or ("events"."format" = 'offline' and nullif(trim("events"."venue_name"), '') is not null)
                or (
                    "events"."format" = 'hybrid'
                    and nullif(trim("events"."online_url"), '') is not null
                    and nullif(trim("events"."venue_name"), '') is not null
                )
            ));

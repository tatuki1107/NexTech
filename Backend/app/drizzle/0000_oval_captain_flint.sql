CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" varchar(500),
	"description" text NOT NULL,
	"format" varchar(32) NOT NULL,
	"venue_name" varchar(200),
	"address" text,
	"online_url" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"capacity" integer NOT NULL,
	"waitlist_enabled" boolean DEFAULT false NOT NULL,
	"application_start_at" timestamp with time zone,
	"application_deadline" timestamp with time zone,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"visibility" varchar(32) DEFAULT 'public' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"website_url" text,
	"contact_email" varchar(254),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"full_name" varchar(100),
	"profile_text" text,
	"avatar_url" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_organizers_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizers" ADD CONSTRAINT "organizers_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_organizer_id_index" ON "events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "events_category_id_index" ON "events" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "events_start_at_index" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organizers_slug_unique" ON "organizers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizers_owner_user_id_index" ON "organizers" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_unique" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");
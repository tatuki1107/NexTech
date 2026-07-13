CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL, display_name varchar(80) NOT NULL, full_name varchar(120),
  profile_text text, avatar_url text, status varchar(20) NOT NULL DEFAULT 'active',
  last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  CONSTRAINT users_status_check CHECK (status IN ('active','suspended','deleted'))
);
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_code varchar(20) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, role_code),
  CONSTRAINT user_roles_code_check CHECK (role_code IN ('participant','organizer','admin'))
);
CREATE TABLE organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id uuid NOT NULL REFERENCES users(id),
  name varchar(120) NOT NULL, slug varchar(120) NOT NULL UNIQUE, description text,
  website_url text, contact_email varchar(255), status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizers_status_check CHECK (status IN ('active','suspended','deleted'))
);
CREATE TABLE organizer_members (
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role varchar(20) NOT NULL DEFAULT 'member', created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organizer_id, user_id)
);
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL,
  slug varchar(120) NOT NULL UNIQUE, description text, display_order integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active', created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(80) NOT NULL,
  slug varchar(80) NOT NULL UNIQUE, created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organizer_id uuid NOT NULL REFERENCES organizers(id),
  category_id uuid NOT NULL REFERENCES categories(id), created_by uuid NOT NULL REFERENCES users(id),
  title varchar(160) NOT NULL, summary varchar(300), description text NOT NULL,
  format varchar(20) NOT NULL, venue_name varchar(160), address text, online_url text,
  start_at timestamptz NOT NULL, end_at timestamptz NOT NULL,
  timezone varchar(50) NOT NULL DEFAULT 'Asia/Tokyo', capacity integer NOT NULL,
  waitlist_enabled boolean NOT NULL DEFAULT false, application_start_at timestamptz,
  application_deadline timestamptz NOT NULL, status varchar(20) NOT NULL DEFAULT 'draft',
  visibility varchar(20) NOT NULL DEFAULT 'public', published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT events_format_check CHECK (format IN ('online','offline','hybrid')),
  CONSTRAINT events_status_check CHECK (status IN ('draft','published','suspended','cancelled','closed')),
  CONSTRAINT events_capacity_check CHECK (capacity >= 0),
  CONSTRAINT events_time_check CHECK (start_at < end_at),
  CONSTRAINT events_deadline_check CHECK (application_deadline <= start_at)
);
CREATE INDEX events_public_search_idx ON events(status, start_at);
CREATE INDEX events_category_idx ON events(category_id);
CREATE INDEX events_organizer_idx ON events(organizer_id);
CREATE INDEX events_title_search_idx ON events USING gin(to_tsvector('simple', title || ' ' || coalesce(summary, '')));
CREATE TABLE event_tags (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (event_id, tag_id)
);
CREATE TABLE registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES events(id),
  user_id uuid NOT NULL REFERENCES users(id), status varchar(20) NOT NULL,
  waitlist_position integer, applied_at timestamptz NOT NULL DEFAULT now(), confirmed_at timestamptz,
  cancelled_at timestamptz, checked_in_at timestamptz, cancellation_reason varchar(255),
  checkin_note varchar(255), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  CONSTRAINT registrations_status_check CHECK (status IN ('confirmed','waitlisted','cancelled','attended','no_show')),
  CONSTRAINT registrations_waitlist_check CHECK ((status = 'waitlisted' AND waitlist_position IS NOT NULL) OR (status <> 'waitlisted' AND waitlist_position IS NULL))
);
CREATE UNIQUE INDEX registrations_active_user_event_idx ON registrations(event_id,user_id) WHERE status <> 'cancelled';
CREATE UNIQUE INDEX registrations_waitlist_position_idx ON registrations(event_id,waitlist_position) WHERE status = 'waitlisted';
CREATE INDEX registrations_event_status_idx ON registrations(event_id,status);
CREATE TABLE registration_status_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), registration_id uuid NOT NULL REFERENCES registrations(id),
  event_id uuid NOT NULL REFERENCES events(id), user_id uuid NOT NULL REFERENCES users(id),
  from_status varchar(20), to_status varchar(20) NOT NULL,
  changed_by_user_id uuid REFERENCES users(id), reason varchar(255), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_favorite_organizers (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, organizer_id)
);
CREATE TABLE user_favorite_categories (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, category_id)
);
CREATE TABLE event_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES events(id),
  changed_by_user_id uuid NOT NULL REFERENCES users(id), change_type varchar(30) NOT NULL,
  before_data jsonb, after_data jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid NOT NULL REFERENCES users(id),
  target_type varchar(30) NOT NULL, target_id uuid NOT NULL, action varchar(30) NOT NULL,
  reason text, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid REFERENCES users(id),
  action varchar(80) NOT NULL, resource_type varchar(50) NOT NULL, resource_id uuid,
  ip_address inet, user_agent text, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL, token_hash varchar(64) NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
  revoked_at timestamptz, replaced_by_id uuid, last_used_at timestamptz, user_agent text,
  ip_address inet, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_sessions_family_idx ON auth_sessions(family_id);

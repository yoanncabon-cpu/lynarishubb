DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_event_type') THEN
    CREATE TYPE "public"."calendar_event_type" AS ENUM ('rdv','contenu','automatisation','tache','autre');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_event_status') THEN
    CREATE TYPE "public"."calendar_event_status" AS ENUM ('confirmed','tentative','cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "calendar_events" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"              uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title"               text NOT NULL,
  "description"         text,
  "start_at"            timestamptz NOT NULL,
  "end_at"              timestamptz NOT NULL,
  "all_day"             boolean NOT NULL DEFAULT false,
  "type"                "calendar_event_type" NOT NULL DEFAULT 'rdv',
  "agent_slug"          text,
  "color"               text,
  "location"            text,
  "google_event_id"     text,
  "google_calendar_id"  text,
  "status"              "calendar_event_status" NOT NULL DEFAULT 'confirmed',
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cal_events_org_idx"    ON "calendar_events"("org_id");
CREATE INDEX IF NOT EXISTS "cal_events_start_idx"  ON "calendar_events"("org_id","start_at");

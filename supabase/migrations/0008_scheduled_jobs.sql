CREATE TABLE IF NOT EXISTS "scheduled_jobs" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"        uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "agent_slug"    text NOT NULL,
  "name"          text NOT NULL,
  "instruction"   text NOT NULL,
  "frequency"     text NOT NULL DEFAULT 'daily',  -- 'daily' | 'weekly' | 'monthly'
  "hour"          integer NOT NULL DEFAULT 9,     -- 0-23 (heure locale)
  "minute"        integer NOT NULL DEFAULT 0,     -- 0-59
  "day_of_week"   integer,                         -- 0=dim, 1=lun... (weekly seulement)
  "day_of_month"  integer,                         -- 1-31 (monthly seulement)
  "timezone"      text NOT NULL DEFAULT 'Europe/Paris',
  "is_active"     boolean NOT NULL DEFAULT true,
  "last_run_at"   timestamptz,
  "next_run_at"   timestamptz,
  "last_result"   text,
  "run_count"     integer NOT NULL DEFAULT 0,
  "created_at"    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "scheduled_jobs_org_idx"      ON "scheduled_jobs"("org_id");
CREATE INDEX IF NOT EXISTS "scheduled_jobs_next_run_idx" ON "scheduled_jobs"("next_run_at") WHERE "is_active" = true;

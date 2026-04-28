-- ─── Contents unified space ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "contents" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"        uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "agent_slug"    text NOT NULL,
  "content_type"  text NOT NULL,
  "platform"      text,
  "title"         text NOT NULL,
  "description"   text,
  "body"          text,
  "status"        text NOT NULL DEFAULT 'published',
  "external_url"  text,
  "external_id"   text,
  "views_count"   integer DEFAULT 0,
  "likes_count"   integer DEFAULT 0,
  "comments_count" integer DEFAULT 0,
  "shares_count"  integer DEFAULT 0,
  "metadata"      jsonb DEFAULT '{}'::jsonb,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "updated_at"    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "content_attachments" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_id"       uuid NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE,
  "attachment_type"  text NOT NULL,
  "storage_url"      text NOT NULL,
  "storage_key"      text DEFAULT '',
  "mime_type"        text,
  "size_bytes"       integer,
  "width"            integer,
  "height"           integer,
  "duration_seconds" integer,
  "position"         integer DEFAULT 0,
  "created_at"       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "contents_org_created_idx"  ON "contents"("org_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "contents_org_agent_idx"    ON "contents"("org_id", "agent_slug");
CREATE INDEX IF NOT EXISTS "contents_org_type_idx"     ON "contents"("org_id", "content_type");
CREATE INDEX IF NOT EXISTS "content_attachments_content_idx" ON "content_attachments"("content_id", "position");

-- ─── Onboarding fields on users ───────────────────────────────────────────────

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "onboarding_completed"    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "onboarding_current_step" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "onboarding_skipped"      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamptz;

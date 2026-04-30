-- Tasks : todo list utilisateur, accessible aux agents (Charles peut create/list/check via tools)
CREATE TABLE IF NOT EXISTS "tasks" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id"       uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title"        text NOT NULL,
  "description"  text,
  "status"       text NOT NULL DEFAULT 'todo',     -- 'todo' | 'in_progress' | 'done'
  "priority"     text NOT NULL DEFAULT 'medium',   -- 'low' | 'medium' | 'high'
  "due_date"     timestamptz,
  "created_by"   text NOT NULL DEFAULT 'user',     -- 'user' | 'agent:<slug>'
  "completed_at" timestamptz,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tasks_org_idx"        ON "tasks"("org_id");
CREATE INDEX IF NOT EXISTS "tasks_org_status_idx" ON "tasks"("org_id", "status");
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx"   ON "tasks"("due_date");

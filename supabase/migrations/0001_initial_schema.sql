-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE plan AS ENUM ('trial', 'starter', 'pro', 'scale');
CREATE TYPE role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE integration_status AS ENUM ('connected', 'expired', 'error');
CREATE TYPE channel AS ENUM ('voice', 'chat', 'whatsapp', 'email', 'internal');
CREATE TYPE action_status AS ENUM ('success', 'error', 'pending');
CREATE TYPE prospect_status AS ENUM ('new', 'contacted', 'replied', 'qualified', 'lost', 'won');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'tool', 'system');
CREATE TYPE n8n_run_status AS ENUM ('pending', 'running', 'success', 'error');

-- ─── Helper function: get org_id from JWT ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'org_id')::uuid;
$$;

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan plan NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  role role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status integration_status NOT NULL DEFAULT 'connected',
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_refreshed_at timestamptz,
  UNIQUE(org_id, provider)
);

CREATE TABLE agent_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  system_prompt_override text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, agent_slug)
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_instance_id uuid REFERENCES agent_instances(id) ON DELETE SET NULL,
  channel channel NOT NULL,
  external_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  summary text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content jsonb NOT NULL,
  tokens_input int,
  tokens_output int,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_instance_id uuid REFERENCES agent_instances(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  type text NOT NULL,
  status action_status NOT NULL DEFAULT 'pending',
  payload jsonb DEFAULT '{}'::jsonb,
  error_message text,
  duration_ms int,
  cost_usd numeric(10,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE n8n_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_slug text NOT NULL,
  trigger_source text,
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb,
  status n8n_run_status NOT NULL DEFAULT 'pending',
  n8n_execution_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_slug text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  source text NOT NULL DEFAULT 'conversation',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name text,
  headline text,
  linkedin_url text,
  email text,
  company text,
  status prospect_status NOT NULL DEFAULT 'new',
  score int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prospecting_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric text NOT NULL,
  quantity numeric(12,4) NOT NULL,
  cost_usd numeric(10,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id text,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL,
  period_start date,
  period_end date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX ON users(org_id);
CREATE INDEX ON integrations(org_id);
CREATE INDEX ON agent_instances(org_id);
CREATE INDEX ON conversations(org_id);
CREATE INDEX ON messages(conversation_id);
CREATE INDEX ON action_logs(org_id);
CREATE INDEX ON action_logs(created_at);
CREATE INDEX ON n8n_runs(org_id);
CREATE INDEX ON agent_memories(org_id);
CREATE INDEX ON prospects(org_id);
CREATE INDEX ON prospects(status);
CREATE INDEX ON usage_events(org_id);
CREATE INDEX ON usage_events(created_at);
CREATE INDEX ON audit_logs(org_id);
CREATE INDEX ON audit_logs(created_at);

-- pgvector index for semantic search
CREATE INDEX ON agent_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: a user can only see their own org
CREATE POLICY "org_isolation" ON organizations
  FOR ALL USING (id = get_org_id());

-- Users: only members of the same org
CREATE POLICY "org_isolation" ON users
  FOR ALL USING (org_id = get_org_id());

-- All other tables: same pattern
CREATE POLICY "org_isolation" ON integrations FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON agent_instances FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON conversations FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON action_logs FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON n8n_runs FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON agent_memories FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON prospects FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON prospecting_sequences FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON usage_events FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON invoices FOR ALL USING (org_id = get_org_id());
CREATE POLICY "org_isolation" ON audit_logs FOR ALL USING (org_id = get_org_id());

-- Messages: join via conversation (same org)
CREATE POLICY "org_isolation" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE org_id = get_org_id()
    )
  );

-- ─── Service role bypass (pour les webhooks Stripe, n8n, etc.) ───────────────
-- Les policies ci-dessus bloquent uniquement les JWT anon/authenticated
-- Les appels avec service_role key bypassen RLS automatiquement

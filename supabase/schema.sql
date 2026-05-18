-- ============================================================
-- LYNARIS HUB — Schema SQL complet
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── Enums ───────────────────────────────────────────────────
CREATE TYPE plan                  AS ENUM ('trial','starter','pro','scale');
CREATE TYPE plan_billing_cycle    AS ENUM ('monthly','annual');
CREATE TYPE role                  AS ENUM ('owner','admin','member');
CREATE TYPE integration_status    AS ENUM ('connected','expired','error');
CREATE TYPE channel               AS ENUM ('voice','chat','whatsapp','email','internal');
CREATE TYPE action_status         AS ENUM ('success','error','pending');
CREATE TYPE prospect_status       AS ENUM ('new','contacted','replied','qualified','lost','won');
CREATE TYPE message_role          AS ENUM ('user','assistant','tool','system');
CREATE TYPE n8n_run_status        AS ENUM ('pending','running','success','error');
CREATE TYPE support_ticket_status AS ENUM ('open','in_progress','resolved','closed');
CREATE TYPE calendar_event_type   AS ENUM ('rdv','contenu','automatisation','tache','autre');
CREATE TYPE calendar_event_status AS ENUM ('confirmed','tentative','cancelled');

-- ─── organizations ───────────────────────────────────────────
CREATE TABLE organizations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL,
  plan                 plan NOT NULL DEFAULT 'trial',
  plan_id              TEXT NOT NULL DEFAULT 'discovery',
  plan_billing_cycle   plan_billing_cycle NOT NULL DEFAULT 'monthly',
  plan_activated_at    TIMESTAMPTZ,
  trial_ends_at        TIMESTAMPTZ,
  stripe_customer_id   TEXT UNIQUE,
  stripe_subscription_id TEXT,
  settings             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX organizations_slug_idx ON organizations (slug);

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE users (
  id                        UUID PRIMARY KEY, -- synced with auth.users
  org_id                    UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  email                     TEXT NOT NULL,
  full_name                 TEXT,
  role                      role NOT NULL DEFAULT 'member',
  onboarding_completed      BOOLEAN DEFAULT FALSE,
  onboarding_current_step   INTEGER DEFAULT 0,
  onboarding_skipped        BOOLEAN DEFAULT FALSE,
  onboarding_completed_at   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX users_email_idx  ON users (email);
CREATE        INDEX users_org_id_idx ON users (org_id);

-- ─── integrations ────────────────────────────────────────────
CREATE TABLE integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,
  status            integration_status NOT NULL DEFAULT 'connected',
  credentials       JSONB NOT NULL DEFAULT '{}',
  metadata          JSONB DEFAULT '{}',
  connected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ
);
CREATE        INDEX integrations_org_id_idx       ON integrations (org_id);
CREATE UNIQUE INDEX integrations_org_provider_idx ON integrations (org_id, provider);

-- ─── agent_instances ─────────────────────────────────────────
CREATE TABLE agent_instances (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_slug             TEXT NOT NULL,
  is_active              BOOLEAN NOT NULL DEFAULT FALSE,
  config                 JSONB DEFAULT '{}',
  system_prompt_override TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE        INDEX agent_instances_org_id_idx   ON agent_instances (org_id);
CREATE UNIQUE INDEX agent_instances_org_slug_idx ON agent_instances (org_id, agent_slug);

-- ─── conversations ────────────────────────────────────────────
CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_instance_id UUID REFERENCES agent_instances (id) ON DELETE RESTRICT,
  channel           channel NOT NULL,
  external_id       TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  summary           TEXT,
  metadata          JSONB DEFAULT '{}'
);
CREATE INDEX conversations_org_id_idx      ON conversations (org_id);
CREATE INDEX conversations_org_started_idx ON conversations (org_id, started_at DESC);

-- ─── messages ────────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role            message_role NOT NULL,
  content         JSONB NOT NULL,
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  model           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX messages_conversation_id_idx ON messages (conversation_id);

-- ─── action_logs ─────────────────────────────────────────────
CREATE TABLE action_logs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_instance_id        UUID REFERENCES agent_instances (id) ON DELETE SET NULL,
  conversation_id          UUID REFERENCES conversations (id) ON DELETE SET NULL,
  type                     TEXT NOT NULL,
  status                   action_status NOT NULL DEFAULT 'pending',
  payload                  JSONB DEFAULT '{}',
  error_message            TEXT,
  duration_ms              INTEGER,
  cost_usd                 NUMERIC(10,6),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_dismissed_at TIMESTAMPTZ
);
CREATE INDEX action_logs_org_id_idx       ON action_logs (org_id);
CREATE INDEX action_logs_created_at_idx   ON action_logs (created_at);
CREATE INDEX action_logs_notif_dismissed_idx ON action_logs (notification_dismissed_at);
CREATE INDEX action_logs_org_created_idx  ON action_logs (org_id, created_at DESC);
CREATE INDEX action_logs_org_type_idx     ON action_logs (org_id, type);
CREATE INDEX action_logs_notif_active_idx ON action_logs (org_id, created_at DESC)
  WHERE notification_dismissed_at IS NULL;

-- ─── n8n_runs ────────────────────────────────────────────────
CREATE TABLE n8n_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  workflow_slug     TEXT NOT NULL,
  trigger_source    TEXT,
  input             JSONB DEFAULT '{}',
  output            JSONB,
  status            n8n_run_status NOT NULL DEFAULT 'pending',
  n8n_execution_id  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);
CREATE INDEX n8n_runs_org_id_idx ON n8n_runs (org_id);

-- ─── agent_memories ──────────────────────────────────────────
CREATE TABLE agent_memories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_slug TEXT NOT NULL,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  source     TEXT NOT NULL DEFAULT 'conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX agent_memories_org_id_idx ON agent_memories (org_id);

-- ─── prospects ───────────────────────────────────────────────
CREATE TABLE prospects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  full_name    TEXT,
  headline     TEXT,
  linkedin_url TEXT,
  email        TEXT,
  company      TEXT,
  status       prospect_status NOT NULL DEFAULT 'new',
  score        INTEGER DEFAULT 0,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX prospects_org_id_idx  ON prospects (org_id);
CREATE INDEX prospects_status_idx  ON prospects (status);

-- ─── prospecting_sequences ───────────────────────────────────
CREATE TABLE prospecting_sequences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  steps      JSONB NOT NULL DEFAULT '[]',
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX prospecting_sequences_org_id_idx ON prospecting_sequences (org_id);

-- ─── usage_events ────────────────────────────────────────────
CREATE TABLE usage_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  metric     TEXT NOT NULL,
  quantity   NUMERIC(12,4) NOT NULL,
  cost_usd   NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX usage_events_org_id_idx      ON usage_events (org_id);
CREATE INDEX usage_events_created_at_idx  ON usage_events (created_at);

-- ─── invoices ────────────────────────────────────────────────
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount_cents      INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'eur',
  status            TEXT NOT NULL,
  period_start      DATE,
  period_end        DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX invoices_org_id_idx ON invoices (org_id);

-- ─── audit_logs ──────────────────────────────────────────────
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users (id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  ip_address   INET,
  user_agent   TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_logs_org_id_idx     ON audit_logs (org_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at);

-- ─── documents ───────────────────────────────────────────────
CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  folder_id    UUID,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'file',
  mime_type    TEXT,
  size_bytes   INTEGER,
  storage_path TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX documents_org_id_idx    ON documents (org_id);
CREATE INDEX documents_folder_id_idx ON documents (folder_id);

-- ─── support_tickets ─────────────────────────────────────────
CREATE TABLE support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  ticket_id   TEXT NOT NULL UNIQUE,
  subject     TEXT NOT NULL,
  category    TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'Normale',
  description TEXT NOT NULL,
  page_url    TEXT,
  user_email  TEXT,
  status      support_ticket_status NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX support_tickets_org_id_idx     ON support_tickets (org_id);
CREATE INDEX support_tickets_created_at_idx ON support_tickets (created_at);

-- ─── ticket_messages ─────────────────────────────────────────
CREATE TABLE ticket_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    TEXT NOT NULL,
  sender_type  TEXT NOT NULL,
  sender_email TEXT,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ticket_messages_ticket_id_idx   ON ticket_messages (ticket_id);
CREATE INDEX ticket_messages_created_at_idx  ON ticket_messages (created_at);

-- ─── contents ────────────────────────────────────────────────
CREATE TABLE contents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_slug     TEXT NOT NULL,
  content_type   TEXT NOT NULL,
  platform       TEXT,
  title          TEXT NOT NULL,
  description    TEXT,
  body           TEXT,
  status         TEXT NOT NULL DEFAULT 'published',
  external_url   TEXT,
  external_id    TEXT,
  views_count    INTEGER DEFAULT 0,
  likes_count    INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count   INTEGER DEFAULT 0,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX contents_org_created_idx ON contents (org_id, created_at);
CREATE INDEX contents_org_agent_idx   ON contents (org_id, agent_slug);
CREATE INDEX contents_org_type_idx    ON contents (org_id, content_type);

-- ─── content_attachments ─────────────────────────────────────
CREATE TABLE content_attachments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id       UUID NOT NULL REFERENCES contents (id) ON DELETE CASCADE,
  attachment_type  TEXT NOT NULL,
  storage_url      TEXT NOT NULL,
  storage_key      TEXT DEFAULT '',
  mime_type        TEXT,
  size_bytes       INTEGER,
  width            INTEGER,
  height           INTEGER,
  duration_seconds INTEGER,
  position         INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX content_attachments_content_idx ON content_attachments (content_id, position);

-- ─── scheduled_jobs ──────────────────────────────────────────
CREATE TABLE scheduled_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_slug    TEXT NOT NULL,
  name          TEXT NOT NULL,
  instruction   TEXT NOT NULL,
  frequency     TEXT NOT NULL DEFAULT 'daily',
  hour          INTEGER NOT NULL DEFAULT 9,
  minute        INTEGER NOT NULL DEFAULT 0,
  day_of_week   INTEGER,
  day_of_month  INTEGER,
  timezone      TEXT NOT NULL DEFAULT 'Europe/Paris',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at   TIMESTAMPTZ,
  next_run_at   TIMESTAMPTZ,
  last_result   TEXT,
  run_count     INTEGER NOT NULL DEFAULT 0,
  category      TEXT,
  email_style   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX scheduled_jobs_org_idx      ON scheduled_jobs (org_id);
CREATE INDEX scheduled_jobs_next_run_idx ON scheduled_jobs (next_run_at);
CREATE INDEX scheduled_jobs_category_idx ON scheduled_jobs (category);

-- ─── tasks ───────────────────────────────────────────────────
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'todo',
  priority     TEXT NOT NULL DEFAULT 'medium',
  due_date     TIMESTAMPTZ,
  created_by   TEXT NOT NULL DEFAULT 'user',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX tasks_org_idx        ON tasks (org_id);
CREATE INDEX tasks_org_status_idx ON tasks (org_id, status);
CREATE INDEX tasks_due_date_idx   ON tasks (due_date);

-- ─── phone_numbers ───────────────────────────────────────────
CREATE TABLE phone_numbers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                TEXT NOT NULL,
  agent_id              UUID,
  twilio_sid            TEXT UNIQUE NOT NULL,
  phone_number          TEXT NOT NULL,
  display_name          TEXT,
  country_code          TEXT NOT NULL DEFAULT 'FR',
  number_type           TEXT NOT NULL DEFAULT 'national',
  direction             TEXT NOT NULL DEFAULT 'inbound',
  is_existing_number    BOOLEAN DEFAULT FALSE,
  forwarding_target     TEXT,
  voice_region          TEXT NOT NULL DEFAULT 'ie1',
  monthly_cost_cents    INTEGER NOT NULL DEFAULT 500,
  stripe_subscription_id TEXT,
  status                TEXT NOT NULL DEFAULT 'active',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  released_at           TIMESTAMPTZ
);
CREATE INDEX idx_phone_numbers_org_active ON phone_numbers (org_id);
CREATE INDEX idx_phone_numbers_agent      ON phone_numbers (agent_id);

-- ─── calendar_events ─────────────────────────────────────────
CREATE TABLE calendar_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  start_at            TIMESTAMPTZ NOT NULL,
  end_at              TIMESTAMPTZ NOT NULL,
  all_day             BOOLEAN NOT NULL DEFAULT FALSE,
  type                calendar_event_type NOT NULL DEFAULT 'rdv',
  agent_slug          TEXT,
  color               TEXT,
  location            TEXT,
  google_event_id     TEXT,
  google_calendar_id  TEXT,
  status              calendar_event_status NOT NULL DEFAULT 'confirmed',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── org_usage_counters ──────────────────────────────────────
CREATE TABLE org_usage_counters (
  org_id                      UUID PRIMARY KEY REFERENCES organizations (id) ON DELETE CASCADE,
  period_start                TIMESTAMPTZ NOT NULL,
  period_end                  TIMESTAMPTZ NOT NULL,
  actions_used                INTEGER NOT NULL DEFAULT 0,
  voice_minutes_used          INTEGER NOT NULL DEFAULT 0,
  rag_docs_count              INTEGER NOT NULL DEFAULT 0,
  team_members_count          INTEGER NOT NULL DEFAULT 1,
  voice_pack_minutes_remaining INTEGER NOT NULL DEFAULT 0,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── usage_ledger ────────────────────────────────────────────
CREATE TABLE usage_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_slug  TEXT,
  action_type TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX usage_ledger_org_id_idx      ON usage_ledger (org_id);
CREATE INDEX usage_ledger_org_created_idx ON usage_ledger (org_id, created_at);

-- ─── usage_costs ─────────────────────────────────────────────
CREATE TABLE usage_costs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_slug       TEXT,
  action_type      TEXT NOT NULL,
  cost_euros       NUMERIC(10,4) NOT NULL,
  provider         TEXT NOT NULL,
  provider_ref     TEXT,
  input_tokens     INTEGER,
  output_tokens    INTEGER,
  duration_seconds INTEGER,
  model_used       TEXT,
  economy_mode     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX usage_costs_org_id_idx    ON usage_costs (org_id);
CREATE INDEX usage_costs_org_created_idx ON usage_costs (org_id, created_at);
CREATE INDEX usage_costs_agent_idx     ON usage_costs (org_id, agent_slug);
CREATE INDEX usage_costs_provider_idx  ON usage_costs (provider, created_at);

-- ─── org_protection_state ────────────────────────────────────
CREATE TABLE org_protection_state (
  org_id                  UUID PRIMARY KEY REFERENCES organizations (id) ON DELETE CASCADE,
  period_start            TIMESTAMPTZ NOT NULL,
  period_end              TIMESTAMPTZ NOT NULL,
  current_cost_euros      NUMERIC(10,4) NOT NULL DEFAULT 0,
  budget_euros            NUMERIC(10,2) NOT NULL,
  notified_admin_70       BOOLEAN NOT NULL DEFAULT FALSE,
  notified_client_90      BOOLEAN NOT NULL DEFAULT FALSE,
  alerted_admin_100       BOOLEAN NOT NULL DEFAULT FALSE,
  alerted_admin_130       BOOLEAN NOT NULL DEFAULT FALSE,
  economy_mode_active     BOOLEAN NOT NULL DEFAULT FALSE,
  hard_cap_active         BOOLEAN NOT NULL DEFAULT FALSE,
  economy_mode_activated_at TIMESTAMPTZ,
  hard_cap_activated_at   TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── push_subscriptions ──────────────────────────────────────
CREATE TABLE push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  user_id    TEXT,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE        INDEX push_sub_org_idx      ON push_subscriptions (org_id);
CREATE UNIQUE INDEX push_sub_endpoint_idx ON push_subscriptions (endpoint);

-- ============================================================
-- RLS — Row Level Security
-- Les tables sensibles sont protégées par org_id via le JWT Supabase.
-- Les opérations serveur utilisent la service_role (bypass RLS).
-- ============================================================

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_attachments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_usage_counters    ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_ledger          ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions    ENABLE ROW LEVEL SECURITY;

-- Fonction helper : org_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION auth_org_id() RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies : chaque user ne voit que les données de son org
CREATE POLICY "org_select" ON organizations    FOR SELECT USING (id = auth_org_id());
CREATE POLICY "org_select" ON users            FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "org_select" ON integrations     FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "org_all"    ON integrations     FOR ALL    USING (org_id = auth_org_id());
CREATE POLICY "org_select" ON agent_instances  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "org_select" ON conversations    FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "org_select" ON messages         FOR SELECT USING (
  conversation_id IN (SELECT id FROM conversations WHERE org_id = auth_org_id())
);
CREATE POLICY "org_select" ON action_logs      FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "org_all"    ON contents         FOR ALL    USING (org_id = auth_org_id());
CREATE POLICY "org_select" ON content_attachments FOR SELECT USING (
  content_id IN (SELECT id FROM contents WHERE org_id = auth_org_id())
);
CREATE POLICY "org_all"    ON tasks            FOR ALL    USING (org_id = auth_org_id());
CREATE POLICY "org_all"    ON scheduled_jobs   FOR ALL    USING (org_id = auth_org_id());
CREATE POLICY "org_all"    ON prospects        FOR ALL    USING (org_id = auth_org_id());
CREATE POLICY "org_all"    ON calendar_events  FOR ALL    USING (org_id = auth_org_id());
CREATE POLICY "org_select" ON org_usage_counters FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "org_select" ON usage_ledger     FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "org_all"    ON push_subscriptions FOR ALL  USING (org_id = auth_org_id());

-- ============================================================
-- Storage buckets
-- Créer manuellement dans Supabase → Storage :
--   1. "contents"  — public  — pour les documents HTML générés par les agents
--   2. "assets"    — public  — pour les logos, images de l'org
--   3. "uploads"   — private — pour les fichiers uploadés par l'utilisateur
-- ============================================================

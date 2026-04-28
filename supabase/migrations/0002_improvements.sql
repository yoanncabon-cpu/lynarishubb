-- Migration v2 — 2026-04-24
-- Tables ajoutées pour les nouvelles features

-- ─── Agent Memories (Charles) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_slug text NOT NULL DEFAULT 'charles',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  importance smallint NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour la recherche par org et importance
CREATE INDEX IF NOT EXISTS idx_agent_memories_org ON agent_memories(org_id, agent_slug, importance DESC);

-- ─── Conversations (persistance chat) ────────────────────────────────────────
-- La table conversations existe peut-être déjà, on ajoute title et privacy
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS privacy text NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'members', 'workspace'));

-- ─── Activities feed ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_slug text NOT NULL,
  action text NOT NULL,
  result text,
  metadata jsonb DEFAULT '{}',
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_activities_org ON agent_activities(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_agent ON agent_activities(org_id, agent_slug, created_at DESC);

-- ─── Integration logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_memories" ON agent_memories
  USING (org_id = get_org_id());

ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_activities" ON agent_activities
  USING (org_id = get_org_id());

ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_integration_logs" ON integration_logs
  USING (org_id = get_org_id());

-- ─── Function: save activity (appelée depuis les tools) ───────────────────────
CREATE OR REPLACE FUNCTION save_agent_activity(
  p_org_id uuid,
  p_agent_slug text,
  p_action text,
  p_result text DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO agent_activities (org_id, agent_slug, action, result, duration_ms, metadata)
  VALUES (p_org_id, p_agent_slug, p_action, p_result, p_duration_ms, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

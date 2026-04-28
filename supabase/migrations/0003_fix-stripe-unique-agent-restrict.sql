-- Migration 0003 — 2026-04-25
-- BUG-025 : unicité stripeCustomerId pour éviter les doublons Stripe customer
-- BUG-015 : restrict sur agentInstanceId pour empêcher la perte silencieuse de référence agent

-- ─── BUG-025 : UNIQUE sur stripe_customer_id ────────────────────────────────
ALTER TABLE organizations
  ADD CONSTRAINT organizations_stripe_customer_id_unique UNIQUE (stripe_customer_id);

-- ─── BUG-015 : ON DELETE RESTRICT sur conversations.agent_instance_id ───────
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_agent_instance_id_fkey;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_agent_instance_id_fkey
  FOREIGN KEY (agent_instance_id)
  REFERENCES agent_instances(id)
  ON DELETE RESTRICT;

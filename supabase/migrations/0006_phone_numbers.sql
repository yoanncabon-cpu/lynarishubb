-- Migration: phone_numbers table
-- Numéros Twilio attribués aux organisations Lynaris

CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID,
  twilio_sid TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  country_code TEXT NOT NULL DEFAULT 'FR',
  number_type TEXT NOT NULL DEFAULT 'national',
  direction TEXT NOT NULL DEFAULT 'inbound',
  is_existing_number BOOLEAN DEFAULT false,
  forwarding_target TEXT,
  voice_region TEXT NOT NULL DEFAULT 'ie1',
  monthly_cost_cents INTEGER NOT NULL DEFAULT 500,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_org_active ON phone_numbers(org_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_phone_numbers_agent ON phone_numbers(agent_id) WHERE agent_id IS NOT NULL;

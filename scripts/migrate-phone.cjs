// Migration phone_numbers — node scripts/migrate-phone.cjs
const postgres = require("../node_modules/postgres/cjs/src/index.js")
require("dotenv").config()

const SQL = `
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  agent_id UUID,
  twilio_sid TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  country_code TEXT NOT NULL DEFAULT 'FR',
  number_type TEXT NOT NULL DEFAULT 'local',
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
`

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("✗ DATABASE_URL manquante dans .env")
    process.exit(1)
  }
  const sql = postgres(connectionString, { ssl: "require", max: 1 })
  try {
    await sql.unsafe(SQL)
    console.log("✓ Migration phone_numbers OK")
  } catch (e) {
    const msg = e && e.message ? e.message : String(e)
    if (msg.includes("already exists")) {
      console.log("✓ Table phone_numbers déjà présente — skip")
    } else {
      console.error("✗ Erreur migration:", msg)
      process.exit(1)
    }
  } finally {
    await sql.end()
  }
}

run()

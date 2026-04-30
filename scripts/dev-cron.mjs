// Dev-only : simule le cron Vercel en local.
// Hit /api/cron/run-jobs chaque minute avec CRON_SECRET pour déclencher
// les scheduled_jobs dont next_run_at est dépassé.
//
// Usage : `node scripts/dev-cron.mjs` (en parallèle de `npm run dev`)
// Stop  : Ctrl+C

// Charge .env (puis .env.local s'il existe) via le loader natif Node 20.12+,
// même parser que celui qu'utilise Next.js → zéro drift sur le secret.
import { existsSync } from "node:fs"

const URL_PATH = process.env.DEV_CRON_URL ?? "http://localhost:3000/api/cron/run-jobs"
const INTERVAL_MS = 60_000

for (const f of [".env", ".env.local", ".env.development", ".env.development.local"]) {
  if (existsSync(f)) {
    try {
      process.loadEnvFile(f)
    } catch (err) {
      console.error(`[dev-cron] échec lecture ${f} : ${err instanceof Error ? err.message : err}`)
    }
  }
}

const secret = process.env.CRON_SECRET
if (!secret) {
  console.error("[dev-cron] CRON_SECRET introuvable (cherché dans .env, .env.local, .env.development, .env.development.local)")
  process.exit(1)
}

function fp(s) {
  return `len=${s.length} ${s.slice(0, 3)}…${s.slice(-3)}`
}

async function tick() {
  const ts = new Date().toLocaleTimeString("fr-FR", { hour12: false })
  try {
    const res = await fetch(URL_PATH, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error(`[dev-cron] ${ts} ✗ HTTP ${res.status}`, data, `(envoyé: ${fp(secret)})`)
      return
    }
    const dispatched = data.dispatched ?? 0
    if (dispatched > 0) {
      console.log(`[dev-cron] ${ts} ✓ ${dispatched} job(s) dispatché(s)`, data.jobIds ?? "")
    } else {
      console.log(`[dev-cron] ${ts} · rien à dispatcher`)
    }
  } catch (err) {
    console.error(`[dev-cron] ${ts} ✗ ${err instanceof Error ? err.message : String(err)} (serveur dev arrêté ?)`)
  }
}

console.log(`[dev-cron] démarré → ${URL_PATH} toutes les 60s`)
void tick()
setInterval(() => void tick(), INTERVAL_MS)

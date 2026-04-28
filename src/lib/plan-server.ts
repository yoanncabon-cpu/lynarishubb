import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Redis } from "@upstash/redis"
import type { PlanId } from "@/lib/plans"

/**
 * Récupère le plan de l'organisation depuis le cache Upstash (TTL 300s)
 * ou en fallback depuis la DB. Appelé une seule fois par Server Component layout.
 *
 * Migration douce : les anciens plans 'starter'/'scale' en DB sont mappés
 * vers la nouvelle nomenclature UI ('pro'/'custom') au moment du read.
 */
export async function getPlanServer(): Promise<PlanId> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id
    if (!userId) return "trial"

    // Tentative cache Upstash si env vars présentes
    const upstashUrl = process.env["UPSTASH_REDIS_REST_URL"]
    const upstashToken = process.env["UPSTASH_REDIS_REST_TOKEN"]

    if (upstashUrl && upstashToken) {
      const redis = new Redis({ url: upstashUrl, token: upstashToken })
      const cacheKey = `plan:${userId}`
      const cached = await redis.get<string>(cacheKey)
      if (cached) {
        return normalizePlan(cached)
      }

      // Cache miss — requête DB
      const plan = await fetchPlanFromDb(userId)

      // Stocker en cache pour 300s
      await redis.set(cacheKey, plan, { ex: 300 })
      return plan
    }

    // Pas de Redis — requête DB directe
    return await fetchPlanFromDb(userId)
  } catch {
    return "trial"
  }
}

async function fetchPlanFromDb(userId: string): Promise<PlanId> {
  const user = await db
    .select({ orgId: users.orgId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const orgId = user[0]?.orgId
  if (!orgId) return "trial"

  const org = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  const raw = org[0]?.plan
  if (!raw) return "trial"

  return normalizePlan(raw)
}

/**
 * Mapping rétrocompatibilité DB → UI 3 plans :
 * - "starter" (ancien Essentiel) → "pro"
 * - "scale"   (ancien Scale)     → "custom"
 * - "trial"  → "trial"
 * - "pro"    → "pro"
 */
function normalizePlan(raw: string): PlanId {
  if (raw === "starter") return "pro"
  if (raw === "scale") return "custom"
  if (raw === "pro" || raw === "trial") return raw
  return "trial"
}

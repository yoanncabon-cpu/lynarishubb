import { Redis } from "@upstash/redis"

/**
 * Cache Redis Upstash partagé — chargé paresseusement.
 *
 * Comportement gracieux :
 * - Si UPSTASH_REDIS_REST_URL + TOKEN sont set → client réel.
 * - Sinon (dev local sans Redis configuré) → null, les wrappers font no-op.
 *
 * Avantage : zéro surprise en dev, gain mesurable en prod (cache hit ≈ 5-15ms vs 200-1500ms DB).
 */

let client: Redis | null = null
let initialized = false

export function getRedis(): Redis | null {
  if (initialized) return client
  initialized = true

  const url = process.env["UPSTASH_REDIS_REST_URL"]
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"]

  if (!url || !token) {
    return null
  }

  client = new Redis({ url, token })
  return client
}

/**
 * Wrapper read-through cache.
 *
 * Si Redis indisponible ou cache miss → exécute `fetcher`, stocke le résultat, le retourne.
 * Si cache hit → retourne la valeur cachée sans appeler `fetcher`.
 *
 * Erreurs Redis = silent fallback : on ne casse jamais la requête utilisateur si Redis tombe.
 *
 * @param key  Clé canonique (préfixe par domaine, ex: `analytics:org_xxx:30`)
 * @param ttlSeconds  Durée de vie cache (recommandé 60-600s pour stats agrégées)
 * @param fetcher  Fonction qui calcule la valeur si miss
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedis()
  if (!redis) return fetcher()

  try {
    const hit = await redis.get<T>(key)
    if (hit !== null && hit !== undefined) return hit
  } catch (err) {
    console.warn("[cache] Redis GET failed, fallback to fetcher:", err instanceof Error ? err.message : err)
    return fetcher()
  }

  const fresh = await fetcher()

  try {
    await redis.set(key, fresh, { ex: ttlSeconds })
  } catch (err) {
    console.warn("[cache] Redis SET failed (non-blocking):", err instanceof Error ? err.message : err)
  }

  return fresh
}

/**
 * Invalidation manuelle d'une clé (utile après mutation : nouvelle conversation, action loggée…).
 */
export async function invalidate(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(key)
  } catch (err) {
    console.warn("[cache] Redis DEL failed:", err instanceof Error ? err.message : err)
  }
}

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

// Lazy singleton
let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  const url = process.env["UPSTASH_REDIS_REST_URL"]
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"]
  // Valider que l'URL pointe bien vers Upstash (commence par https:// et contient upstash)
  if (!url || !token || !url.startsWith("https://") || !url.includes("upstash")) {
    return null // Rate limiting désactivé si Redis non configuré ou URL invalide
  }
  if (!ratelimit) {
    try {
      const redis = new Redis({ url, token })
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "lynaris",
      })
    } catch {
      return null // Redis init failed — continue sans rate limiting
    }
  }
  return ratelimit
}

// Per-route limiters
export const limiters = {
  api: { requests: 100, window: "1 m" },
  ai: { requests: 10, window: "1 m" },
  demo: { requests: 3, window: "24 h" },
  auth: { requests: 5, window: "1 m" },
} as const

export async function checkRateLimit(
  request: NextRequest,
  type: keyof typeof limiters = "api"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number } | null> {
  const rl = getRatelimit()
  if (!rl) return null // Disabled

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "anonymous"

  const identifier = `${type}:${ip}`
  const result = await rl.limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { error: "Trop de requêtes. Réessayez dans quelques instants." },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    }
  )
}

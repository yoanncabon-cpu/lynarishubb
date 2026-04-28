export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import twilio from "twilio"

const CACHE: Map<string, { ts: number; data: unknown }> = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

function getTwilioClient() {
  const sid = process.env["TWILIO_ACCOUNT_SID"]
  const token = process.env["TWILIO_AUTH_TOKEN"]
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN manquant")
  return twilio(sid, token)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  let body: { country?: string; area_code?: string } = {}
  try { body = await req.json() as typeof body } catch { /* ok */ }

  const country = body.country ?? "FR"
  const areaCode = body.area_code ?? ""
  const cacheKey = `twilio:available:${country}:national:${areaCode || "any"}`

  // Cache 5 min
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ numbers: cached.data })
  }

  try {
    const client = getTwilioClient()
    const params: Record<string, unknown> = { limit: 10, voiceEnabled: true, smsEnabled: true }
    if (areaCode) params["areaCode"] = areaCode

    // Essaie local d'abord, fallback national si vide
    const localNums = await client.availablePhoneNumbers(country).local.list(params)
    const available = localNums.length > 0
      ? localNums
      : await client.availablePhoneNumbers(country).national.list(params).catch(() => [])


    const numbers = available.map((n) => ({
      phoneNumber: n.phoneNumber,
      locality: n.locality ?? "France",
      region: n.region ?? "",
      isoCountry: n.isoCountry,
    }))

    CACHE.set(cacheKey, { ts: Date.now(), data: numbers })
    return NextResponse.json({ numbers })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Twilio"
    console.error("[phone-numbers/search] Twilio error:", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

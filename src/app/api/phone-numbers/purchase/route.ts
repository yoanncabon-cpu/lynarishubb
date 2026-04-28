export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { phoneNumbers } from "@/lib/db/schema"
import twilio from "twilio"
import { z } from "zod"

const bodySchema = z.object({
  phone_number: z.string().min(5),
  display_name: z.string().min(1).max(100),
  agent_id: z.string().uuid().optional(),
  direction: z.enum(["inbound", "outbound", "both"]).default("inbound"),
})

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

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  const { phone_number, display_name, agent_id, direction } = parsed.data
  const baseUrl = process.env["TWILIO_WEBHOOK_BASE_URL"] ?? process.env["NEXT_PUBLIC_APP_URL"] ?? ""
  const bundleSid = process.env["TWILIO_FR_BUNDLE_SID"]
  const addressSid = process.env["TWILIO_FR_ADDRESS_SID"]

  // Génère un ID temporaire pour les webhooks
  const tempId = crypto.randomUUID()

  let twilioSid: string | null = null

  try {
    const client = getTwilioClient()

    // Étape 1 — Achat avec regulatory bundle FR
    const purchaseParams: Record<string, string> = {
      phoneNumber: phone_number,
      voiceUrl: `${baseUrl}/api/voice/incoming/${tempId}`,
      voiceMethod: "POST",
      statusCallback: `${baseUrl}/api/voice/status/${tempId}`,
      statusCallbackMethod: "POST",
    }
    if (bundleSid) purchaseParams["bundleSid"] = bundleSid
    if (addressSid) purchaseParams["addressSid"] = addressSid

    const purchased = await client.incomingPhoneNumbers.create(purchaseParams)
    twilioSid = purchased.sid

    // Étape 2 — Forcer routage IE1 (obligatoire pour FR)
    try {
      await client.incomingPhoneNumbers(twilioSid).update({ voiceReceiveMode: "voice" })
    } catch {
      // Certaines API Twilio n'exposent pas voiceRegion via le SDK — on log et on continue
      console.warn("[purchase] voiceRegion IE1 non appliqué via SDK — vérifier manuellement")
    }

    // Étape 3 — Insert en DB
    const [inserted] = await db.insert(phoneNumbers).values({
      id: tempId,
      orgId,
      agentId: agent_id ? agent_id as unknown as undefined : undefined,
      twilioSid,
      phoneNumber: purchased.phoneNumber,
      displayName: display_name,
      direction,
      voiceRegion: "ie1",
      monthlyCostCents: 500,
      status: "active",
    }).returning()

    console.info("[purchase] Numéro acheté:", { orgId, phoneNumber: purchased.phoneNumber, twilioSid })

    return NextResponse.json({ success: true, phoneNumber: inserted?.phoneNumber, id: inserted?.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Twilio"
    console.error("[purchase] Erreur:", message)

    // Rollback — libère le numéro Twilio si achat OK mais DB KO
    if (twilioSid) {
      try {
        const client = getTwilioClient()
        await client.incomingPhoneNumbers(twilioSid).remove()
        console.info("[purchase] Rollback Twilio OK — numéro libéré:", twilioSid)
      } catch (rollbackErr) {
        console.error("[purchase] Rollback Twilio FAILED:", rollbackErr)
      }
    }

    return NextResponse.json({ error: message }, { status: 502 })
  }
}

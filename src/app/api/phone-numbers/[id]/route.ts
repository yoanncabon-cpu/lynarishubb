export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { phoneNumbers } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import twilio from "twilio"
import { logger } from "@/lib/logger"

function getTwilioClient() {
  const sid = process.env["TWILIO_ACCOUNT_SID"]
  const token = process.env["TWILIO_AUTH_TOKEN"]
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN manquant")
  return twilio(sid, token)
}

// DELETE /api/phone-numbers/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { id } = await params

  // Vérifie ownership
  const [num] = await db
    .select()
    .from(phoneNumbers)
    .where(and(eq(phoneNumbers.id, id), eq(phoneNumbers.orgId, orgId)))
    .limit(1)

  if (!num) {
    return NextResponse.json({ error: "Numéro introuvable" }, { status: 404 })
  }

  try {
    const client = getTwilioClient()

    // Libère chez Twilio
    await client.incomingPhoneNumbers(num.twilioSid).remove()

    // Marque comme libéré en DB
    await db
      .update(phoneNumbers)
      .set({ status: "released", releasedAt: new Date() })
      .where(eq(phoneNumbers.id, id))

    logger.info("phone-numbers numéro libéré", { orgId, phoneNumber: num.phoneNumber })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Twilio"
    logger.error("phone-numbers DELETE échoué", { err: message })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

// POST /api/phone-numbers/:id/assign — géré dans [id]/assign/route.ts

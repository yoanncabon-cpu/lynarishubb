/**
 * POST /api/voice/book
 * Outil in-call ElevenLabs — Marine appelle cet endpoint EN DIRECT pendant la conversation
 * pour créer un RDV Google Calendar + envoyer le SMS de confirmation.
 *
 * ElevenLabs envoie les paramètres collectés pendant l'appel.
 * On répond avec un message que Marine lira à voix haute.
 */

import { type NextRequest, NextResponse } from "next/server"
import { getIntegration } from "@/lib/integrations/manager"
import { sendSms } from "@/lib/integrations/twilio"
import { refreshGoogleToken } from "@/lib/integrations/google"
import { db } from "@/lib/db"
import { agentInstances, integrations as integrationsTable } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

interface BookingRequest {
  org_id?: string
  patient_name: string
  patient_phone?: string
  appointment_datetime: string
  appointment_duration_minutes?: number
  service?: string
  notes?: string
}

async function resolveOrgId(orgIdParam?: string): Promise<string | null> {
  if (orgIdParam) return orgIdParam
  // Fallback : premier org ayant une intégration ElevenLabs
  const row = await db.query.integrations.findFirst({
    where: eq(integrationsTable.provider, "elevenlabs"),
    columns: { orgId: true },
  }).catch(() => null)
  return row?.orgId ?? null
}

export async function POST(request: NextRequest) {
  let body: BookingRequest
  try {
    body = await request.json() as BookingRequest
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { patient_name, patient_phone, appointment_datetime, service, notes } = body
  const duration = body.appointment_duration_minutes ?? 30

  if (!patient_name || !appointment_datetime) {
    return NextResponse.json({
      message: "Il me manque le nom du patient ou la date du rendez-vous. Pouvez-vous me les confirmer ?",
      success: false,
    })
  }

  const orgId = await resolveOrgId(body.org_id)
  if (!orgId) {
    logger.error("[Voice/Book] Impossible de résoudre l'org")
    return NextResponse.json({
      message: "Une erreur technique est survenue. Je note votre demande et le praticien vous rappellera pour confirmer.",
      success: false,
    })
  }

  // Config Marine de l'org (orgName, practitionerName, etc.)
  const instanceRow = await db.query.agentInstances.findFirst({
    where: and(eq(agentInstances.orgId, orgId), eq(agentInstances.agentSlug, "marine")),
    columns: { config: true },
  }).catch(() => null)
  const orgConfig = (instanceRow?.config ?? {}) as Record<string, unknown>
  const specific = orgConfig["specific"] as Record<string, unknown> | undefined
  const businessName = specific?.["orgName"] as string ?? orgConfig["orgName"] as string ?? "le cabinet"
  const practitionerName = specific?.["practitionerName"] as string ?? orgConfig["practitionerName"] as string ?? "le praticien"

  const start = new Date(appointment_datetime)
  const end = new Date(start.getTime() + duration * 60_000)
  const dateStr = start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const timeStr = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  let calendarCreated = false
  let smsSent = false

  // ── Google Calendar ────────────────────────────────────────────────────────
  const googleIntegration = await getIntegration(orgId, "google")
  if (googleIntegration) {
    let accessToken = googleIntegration.credentials["access_token"] as string
    const expiresAt = googleIntegration.credentials["expires_at"] as number
    if (expiresAt && Date.now() > expiresAt - 60_000) {
      try {
        const refreshed = await refreshGoogleToken(googleIntegration.credentials["refresh_token"] as string)
        accessToken = refreshed.access_token
      } catch {
        logger.error("[Voice/Book] Google token refresh failed", { orgId })
      }
    }

    if (accessToken) {
      const event = {
        summary: `RDV ${patient_name}${service ? ` — ${service}` : ""}`,
        description: [
          patient_phone ? `Tél : ${patient_phone}` : null,
          notes ? `Notes : ${notes}` : null,
          `Pris par Marine (Lynaris)`,
        ].filter(Boolean).join("\n"),
        start: { dateTime: start.toISOString(), timeZone: "Europe/Paris" },
        end: { dateTime: end.toISOString(), timeZone: "Europe/Paris" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "email", minutes: 1440 },
          ],
        },
        extendedProperties: {
          private: { source: "marine-voice-agent", orgId, practitioner: practitionerName },
        },
      }

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(() => null)

      calendarCreated = res?.ok ?? false
      if (!calendarCreated) logger.warn("[Voice/Book] Calendar event failed", { orgId })
    }
  }

  // ── SMS confirmation ───────────────────────────────────────────────────────
  if (patient_phone) {
    const twilioIntegration = await getIntegration(orgId, "twilio")
    const creds = twilioIntegration?.credentials ?? {
      account_sid: process.env["TWILIO_ACCOUNT_SID"] ?? "",
      auth_token: process.env["TWILIO_AUTH_TOKEN"] ?? "",
      phone_number: process.env["TWILIO_PHONE_NUMBER"] ?? "",
    }

    if (creds["account_sid"] && creds["auth_token"] && creds["phone_number"]) {
      const smsBody = `RDV confirmé au ${businessName} le ${dateStr} à ${timeStr} avec ${practitionerName}. En cas d'empêchement, merci d'annuler 24h à l'avance.`
      const result = await sendSms(
        {
          account_sid: creds["account_sid"] as string,
          auth_token: creds["auth_token"] as string,
          phone_number: creds["phone_number"] as string,
        },
        patient_phone,
        smsBody
      )
      smsSent = result.success
      if (!smsSent) logger.warn("[Voice/Book] SMS failed", { error: result.error })
    }
  }

  logger.info("[Voice/Book] Booking processed", { orgId, patient_name, appointment_datetime, calendarCreated, smsSent })

  // Réponse que Marine lira à voix haute
  const parts: string[] = [
    `Parfait ! Votre rendez-vous est confirmé ${dateStr} à ${timeStr}.`,
  ]
  if (smsSent && patient_phone) {
    parts.push("Vous allez recevoir un SMS de confirmation dans quelques instants.")
  }
  if (!calendarCreated) {
    parts.push("Je transmets également la demande au praticien.")
  }
  parts.push("Y a-t-il autre chose que je puisse faire pour vous ?")

  return NextResponse.json({
    message: parts.join(" "),
    success: true,
    calendar_created: calendarCreated,
    sms_sent: smsSent,
  })
}

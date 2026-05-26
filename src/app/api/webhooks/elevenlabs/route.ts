/**
 * Webhook post-appel ElevenLabs — remplace le scénario Make.
 *
 * ElevenLabs envoie un POST avec signature HMAC-SHA256 après chaque appel.
 * On extrait les infos RDV via Claude, crée l'event Google Calendar,
 * envoie le SMS de confirmation Twilio.
 *
 * Setup ElevenLabs : Agents → Webhooks → URL = /api/webhooks/elevenlabs
 * Ajouter ELEVENLABS_WEBHOOK_SECRET dans .env.
 * Passer org_id dans les custom_variables de l'agent ElevenLabs.
 */

import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getIntegration } from "@/lib/integrations/manager"
import { sendSms } from "@/lib/integrations/twilio"
import { refreshGoogleToken } from "@/lib/integrations/google"
import { db } from "@/lib/db"
import { agentInstances, integrations as integrationsTable } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

// ─── Types ElevenLabs ─────────────────────────────────────────────────────────

interface ElevenLabsTranscriptItem {
  role: "user" | "agent"
  message: string
  time_in_call_secs?: number
}

interface ElevenLabsPostCallPayload {
  type: string
  event_timestamp: number
  data: {
    agent_id: string
    agent_name?: string
    conversation_id: string
    status: string
    metadata: {
      phone_call?: {
        external_number?: string
        call_sid?: string
      }
      call_duration_secs?: number
      start_time_unix_secs?: number
    }
    transcript: ElevenLabsTranscriptItem[]
    conversation_variables?: Record<string, string>
    analysis?: {
      data_collection?: Record<string, string>
      call_successful?: string
      transcript_summary?: string
    }
  }
}

// ─── RDV extraction schema ────────────────────────────────────────────────────

interface ExtractedRdv {
  has_appointment: boolean
  patient_name: string | null
  patient_phone: string | null
  appointment_datetime: string | null
  appointment_duration_minutes: number
  service: string | null
  notes: string | null
}

// ─── HMAC verification ────────────────────────────────────────────────────────

async function verifyElevenLabsSignature(request: NextRequest, body: string): Promise<boolean> {
  const secret = process.env["ELEVENLABS_WEBHOOK_SECRET"]
  if (!secret) return true // pas de secret configuré = mode dev permissif

  const header = request.headers.get("elevenlabs-signature") ?? ""
  // Format : "t=TIMESTAMP,v0=HASH"
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=" as never)))
  const timestamp = parts["t"] as string | undefined
  const hash = parts["v0"] as string | undefined
  if (!timestamp || !hash) return false

  const payload = `${timestamp}.${body}`
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")

  return expected === hash
}

// ─── Resolve orgId from ElevenLabs agent_id ───────────────────────────────────

async function resolveOrgId(payload: ElevenLabsPostCallPayload): Promise<string | null> {
  // Priorité 1 : org_id passé dans conversation_variables (recommandé)
  const fromVars = payload.data.conversation_variables?.["org_id"]
  if (fromVars) return fromVars

  // Priorité 2 : cherche une intégration ElevenLabs dont agent_id correspond
  const allRows = await db.query.integrations.findMany({
    where: eq(integrationsTable.provider, "elevenlabs"),
    columns: { orgId: true, metadata: true },
  }).catch(() => [])

  for (const row of allRows) {
    const meta = row.metadata as Record<string, unknown>
    if (meta["agent_id"] === payload.data.agent_id) return row.orgId
  }

  return null
}

// ─── Extract RDV with Claude ──────────────────────────────────────────────────

async function extractRdv(transcript: ElevenLabsTranscriptItem[], orgConfig: Record<string, unknown>): Promise<ExtractedRdv> {
  const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] })

  const transcriptText = transcript
    .map(t => `${t.role === "agent" ? "Marine" : "Patient"}: ${t.message}`)
    .join("\n")

  const duration = Number(orgConfig["appointmentDuration"] ?? 30)

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: "Tu es un assistant qui extrait des informations de prise de rendez-vous depuis une transcription d'appel. Réponds UNIQUEMENT en JSON valide, sans markdown.",
    messages: [{
      role: "user",
      content: `Transcription d'appel :\n${transcriptText}\n\nExtrait les infos RDV en JSON :\n{\n  "has_appointment": boolean,\n  "patient_name": string|null,\n  "patient_phone": string|null,\n  "appointment_datetime": "ISO 8601"|null,\n  "appointment_duration_minutes": number (défaut: ${duration}),\n  "service": string|null,\n  "notes": string|null\n}`,
    }],
  })

  const raw = response.content.find(b => b.type === "text")?.text ?? "{}"
  try {
    return JSON.parse(raw) as ExtractedRdv
  } catch {
    return { has_appointment: false, patient_name: null, patient_phone: null, appointment_datetime: null, appointment_duration_minutes: duration, service: null, notes: null }
  }
}

// ─── Google Calendar event ────────────────────────────────────────────────────

async function createCalendarEvent(orgId: string, rdv: ExtractedRdv, orgConfig: Record<string, unknown>): Promise<boolean> {
  if (!rdv.appointment_datetime) return false

  const googleIntegration = await getIntegration(orgId, "google")
  if (!googleIntegration) {
    logger.warn("[EL webhook] No Google integration for org", { orgId })
    return false
  }

  let accessToken = googleIntegration.credentials["access_token"] as string
  const expiresAt = googleIntegration.credentials["expires_at"] as number

  // Refresh si expiré
  if (expiresAt && Date.now() > expiresAt - 60_000) {
    try {
      const refreshed = await refreshGoogleToken(googleIntegration.credentials["refresh_token"] as string)
      accessToken = refreshed.access_token
    } catch {
      logger.error("[EL webhook] Google token refresh failed", { orgId })
      return false
    }
  }

  const start = new Date(rdv.appointment_datetime)
  const end = new Date(start.getTime() + rdv.appointment_duration_minutes * 60_000)

  const businessName = orgConfig["orgName"] ?? "Cabinet"
  const practitionerName = orgConfig["practitionerName"] ?? "le praticien"

  const event = {
    summary: `RDV ${rdv.patient_name ?? "Patient"} — ${rdv.service ?? "Consultation"}`,
    description: [
      rdv.patient_phone ? `Téléphone : ${rdv.patient_phone}` : null,
      rdv.notes ? `Notes : ${rdv.notes}` : null,
      `Pris via Marine (${businessName})`,
    ].filter(Boolean).join("\n"),
    start: { dateTime: start.toISOString(), timeZone: "Europe/Paris" },
    end: { dateTime: end.toISOString(), timeZone: "Europe/Paris" },
    attendees: rdv.patient_phone ? [{ email: `patient+${rdv.patient_phone.replace(/\+/g, "")}@noreply.lynaris.fr` }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 1440 },
      ],
    },
    extendedProperties: {
      private: {
        source: "marine-voice-agent",
        orgId,
        practitioner: String(practitionerName),
      },
    },
  }

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    logger.error("[EL webhook] Google Calendar error", { status: res.status, err })
    return false
  }

  logger.info("[EL webhook] Calendar event created", { orgId, patient: rdv.patient_name })
  return true
}

// ─── SMS confirmation ─────────────────────────────────────────────────────────

async function sendConfirmationSms(orgId: string, rdv: ExtractedRdv, orgConfig: Record<string, unknown>): Promise<boolean> {
  if (!rdv.patient_phone || !rdv.appointment_datetime) return false

  const businessName = orgConfig["orgName"] ?? "votre cabinet"
  const start = new Date(rdv.appointment_datetime)
  const dateStr = start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const timeStr = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  const body = `RDV confirmé au ${businessName} le ${dateStr} à ${timeStr}. En cas d'empêchement, merci d'annuler 24h à l'avance. Marine.`

  // Essaie d'abord les credentials Twilio de l'org, sinon les env vars
  const twilioIntegration = await getIntegration(orgId, "twilio")
  const credentials = twilioIntegration?.credentials ?? {
    account_sid: process.env["TWILIO_ACCOUNT_SID"] ?? "",
    auth_token: process.env["TWILIO_AUTH_TOKEN"] ?? "",
    phone_number: process.env["TWILIO_PHONE_NUMBER"] ?? "",
  }

  if (!credentials["account_sid"] || !credentials["auth_token"] || !credentials["phone_number"]) {
    logger.warn("[EL webhook] Twilio credentials manquants", { orgId })
    return false
  }

  const result = await sendSms(
    {
      account_sid: credentials["account_sid"] as string,
      auth_token: credentials["auth_token"] as string,
      phone_number: credentials["phone_number"] as string,
    },
    rdv.patient_phone,
    body
  )

  if (!result.success) {
    logger.error("[EL webhook] SMS failed", { error: result.error, orgId })
    return false
  }

  logger.info("[EL webhook] SMS envoyé", { to: rdv.patient_phone, sid: result.sid })
  return true
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const bodyText = await request.text()

  const valid = await verifyElevenLabsSignature(request, bodyText)
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: ElevenLabsPostCallPayload
  try {
    payload = JSON.parse(bodyText) as ElevenLabsPostCallPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // On ne traite que l'événement post_call_transcription
  if (payload.type !== "post_call_transcription") {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const orgId = await resolveOrgId(payload)
  if (!orgId) {
    logger.warn("[EL webhook] orgId introuvable", { agent_id: payload.data.agent_id })
    return NextResponse.json({ ok: true, warning: "org_id non résolu" })
  }

  // Récupère la config Marine de l'org
  const instanceRow = await db.query.agentInstances.findFirst({
    where: and(eq(agentInstances.orgId, orgId), eq(agentInstances.agentSlug, "marine")),
    columns: { config: true },
  }).catch(() => null)
  const orgConfig = (instanceRow?.config ?? {}) as Record<string, unknown>

  const { transcript } = payload.data
  if (!transcript || transcript.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: "no transcript" })
  }

  // Extraction RDV
  const rdv = await extractRdv(transcript, orgConfig)

  let calendarCreated = false
  let smsSent = false

  if (rdv.has_appointment) {
    ;[calendarCreated, smsSent] = await Promise.all([
      createCalendarEvent(orgId, rdv, orgConfig),
      sendConfirmationSms(orgId, rdv, orgConfig),
    ])
  }

  logger.info("[EL webhook] post-call processed", {
    orgId,
    conversationId: payload.data.conversation_id,
    hasAppointment: rdv.has_appointment,
    calendarCreated,
    smsSent,
  })

  return NextResponse.json({
    ok: true,
    has_appointment: rdv.has_appointment,
    calendar_created: calendarCreated,
    sms_sent: smsSent,
  })
}

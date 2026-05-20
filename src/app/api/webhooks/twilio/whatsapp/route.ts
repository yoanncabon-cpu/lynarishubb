export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { integrations, organizations } from "@/lib/db/schema"
import { decryptCredentials } from "@/lib/crypto"
import { runAgent } from "@/lib/agents/executor"
import { getHistory, pushHistory } from "@/lib/whatsapp/conversation-store"
import { logger } from "@/lib/logger"
import { eq } from "drizzle-orm"

// ── Validation signature Twilio (HMAC-SHA1) ──────────────────────────────────

async function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import("node:crypto")
  const sortedStr = url + Object.keys(params).sort().map((k) => k + (params[k] ?? "")).join("")
  const expected = createHmac("sha1", authToken).update(sortedStr, "utf-8").digest("base64")
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

// ── Envoi message WhatsApp via Twilio ────────────────────────────────────────

async function sendTwilioWhatsApp(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
): Promise<void> {
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
  const messagingSid = process.env["TWILIO_MESSAGING_SERVICE_SID"]

  const payload: Record<string, string> = { To: to, Body: body }
  if (messagingSid) {
    payload["MessagingServiceSid"] = messagingSid
  } else {
    payload["From"] = from
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload),
    },
  )
  if (!res.ok) {
    const err = await res.json() as { message?: string }
    logger.error("[twilio-wa] Envoi échoué", { error: err.message })
  }
}

// ── Résolution orgId ─────────────────────────────────────────────────────────

async function resolveOrgId(): Promise<string | null> {
  // 1. Cherche une intégration Twilio avec orgId
  try {
    const rows = await db.select().from(integrations).where(eq(integrations.provider, "twilio"))
    if (rows[0]?.orgId) return rows[0].orgId
  } catch { /* ignore */ }

  // 2. Fallback : première organisation
  try {
    const rows = await db.select({ id: organizations.id }).from(organizations).limit(1)
    if (rows[0]?.id) return rows[0].id
  } catch { /* ignore */ }

  return null
}

// ── POST : messages entrants Twilio WhatsApp ──────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const params = Object.fromEntries(new URLSearchParams(rawBody).entries())

  const accountSid = process.env["TWILIO_ACCOUNT_SID"]
  const authToken  = process.env["TWILIO_AUTH_TOKEN"]

  if (!accountSid || !authToken) {
    logger.error("[twilio-wa] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN manquants")
    return NextResponse.json({ error: "Twilio non configuré" }, { status: 500 })
  }

  // Validation signature (désactivée en dev si TWILIO_SKIP_SIGNATURE=true)
  if (process.env["TWILIO_SKIP_SIGNATURE"] !== "true") {
    const signature = req.headers.get("x-twilio-signature") ?? ""
    const url = `${process.env["TWILIO_WEBHOOK_BASE_URL"] ?? "https://localhost:3000"}/api/webhooks/twilio/whatsapp`
    const valid = await validateTwilioSignature(authToken, url, params, signature)
    if (!valid) {
      logger.warn("[twilio-wa] Signature invalide — message ignoré")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const from = params["From"] ?? ""   // "whatsapp:+33768XXXXXX"
  const to   = params["To"]   ?? ""   // "whatsapp:+14155238886" (sandbox)
  const text = (params["Body"] ?? "").trim()

  if (!from || !text) return NextResponse.json({ ok: true })

  // Normalise le numéro expéditeur (retire le préfixe "whatsapp:")
  const senderPhone = from.replace("whatsapp:", "")

  // Traitement en arrière-plan — répond 200 immédiatement à Twilio
  void processMessage({ accountSid, authToken, from, to, senderPhone, text }).catch(
    (err) => logger.error("[twilio-wa] processMessage échoué", { err: String(err) })
  )

  return NextResponse.json({ ok: true })
}

// ── Traitement du message ────────────────────────────────────────────────────

async function processMessage(opts: {
  accountSid: string
  authToken: string
  from: string
  to: string
  senderPhone: string
  text: string
}): Promise<void> {
  const { accountSid, authToken, from, to, senderPhone, text } = opts

  const orgId = await resolveOrgId()
  if (!orgId) {
    logger.error("[twilio-wa] orgId introuvable — message ignoré")
    return
  }

  // Historique conversation
  pushHistory(orgId, senderPhone, { role: "user", content: text })
  const history = getHistory(orgId, senderPhone)

  // Récupère nom depuis intégration si dispo
  let senderName: string | undefined
  try {
    const rows = await db.select().from(integrations).where(eq(integrations.provider, "twilio"))
    if (rows[0]?.credentials) {
      const creds = await decryptCredentials<Record<string, string>>(
        rows[0].credentials as unknown as string
      )
      senderName = creds.display_name ?? undefined
    }
  } catch { /* ignore */ }

  // Appel Charles
  let reply: string
  try {
    logger.info("[twilio-wa] Appel Charles", { senderPhone, text: text.slice(0, 60) })
    const result = await runAgent({
      agentSlug: "charles",
      messages: history,
      orgId,
      config: { channel: "whatsapp", senderPhone, senderName },
    })
    reply = result.content.trim()
  } catch (err) {
    logger.error("[twilio-wa] runAgent échoué", { err: String(err) })
    reply = "Désolé, une erreur est survenue. Réessaie dans quelques instants."
  }

  if (!reply) return

  pushHistory(orgId, senderPhone, { role: "assistant", content: reply })
  await sendTwilioWhatsApp(accountSid, authToken, to, from, reply)
  logger.info("[twilio-wa] Réponse envoyée", { to: senderPhone, reply: reply.slice(0, 60) })
}

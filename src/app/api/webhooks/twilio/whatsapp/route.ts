export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse, after } from "next/server"
import { db } from "@/lib/db"
import { integrations, organizations } from "@/lib/db/schema"
import { runAgent } from "@/lib/agents/executor"
import { getHistory, pushHistory } from "@/lib/whatsapp/conversation-store"
import { logger } from "@/lib/logger"
import { eq } from "drizzle-orm"

// ── Envoi reply WhatsApp via Twilio ──────────────────────────────────────────

async function sendReply(
  accountSid: string,
  authToken: string,
  sandboxNumber: string,   // whatsapp:+14155238886
  userNumber: string,      // whatsapp:+33XXXXXXXXX
  body: string,
): Promise<void> {
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: sandboxNumber,  // toujours le numéro sandbox, pas le MessagingServiceSid
        To:   userNumber,
        Body: body,
      }),
    },
  )
  if (!res.ok) {
    const err = await res.json() as { message?: string }
    logger.error("[twilio-wa] Envoi reply échoué", { status: res.status, error: err.message })
  } else {
    logger.info("[twilio-wa] Reply envoyée", { to: userNumber })
  }
}

// ── Résolution orgId ─────────────────────────────────────────────────────────

async function resolveOrgId(): Promise<string | null> {
  try {
    const rows = await db.select().from(integrations).where(eq(integrations.provider, "twilio"))
    if (rows[0]?.orgId) return rows[0].orgId
  } catch { /* ignore */ }

  try {
    const rows = await db.select({ id: organizations.id }).from(organizations).limit(1)
    if (rows[0]?.id) return rows[0].id
  } catch { /* ignore */ }

  return null
}

// ── POST : messages entrants Twilio WhatsApp ──────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const params  = Object.fromEntries(new URLSearchParams(rawBody).entries())

  const accountSid = process.env["TWILIO_ACCOUNT_SID"]
  const authToken  = process.env["TWILIO_AUTH_TOKEN"]

  if (!accountSid || !authToken) {
    logger.error("[twilio-wa] Credentials Twilio manquants")
    return new NextResponse("", { status: 200 })
  }

  const from = params["From"] ?? ""   // whatsapp:+33XXXXXXXXX (utilisateur)
  const to   = params["To"]   ?? ""   // whatsapp:+14155238886 (sandbox)
  const text = (params["Body"] ?? "").trim()

  logger.info("[twilio-wa] Message reçu", { from, to, text: text.slice(0, 60) })

  if (!from || !to || !text) return new NextResponse("", { status: 200 })

  const senderPhone = from.replace("whatsapp:", "")

  // `after()` garantit que Vercel n'arrête pas la fonction après la réponse 200
  after(async () => {
    const orgId = await resolveOrgId()
    if (!orgId) {
      logger.error("[twilio-wa] orgId introuvable")
      return
    }

    pushHistory(orgId, senderPhone, { role: "user", content: text })
    const history = getHistory(orgId, senderPhone)

    let reply: string
    try {
      logger.info("[twilio-wa] Appel Charles", { orgId, senderPhone })
      const result = await runAgent({
        agentSlug: "charles",
        messages:  history,
        orgId,
        config: { channel: "whatsapp", senderPhone },
      })
      reply = result.content.trim()
      logger.info("[twilio-wa] Charles a répondu", { preview: reply.slice(0, 80) })
    } catch (err) {
      logger.error("[twilio-wa] runAgent échoué", { err: String(err) })
      reply = "Désolé, une erreur est survenue. Réessaie dans quelques instants."
    }

    if (!reply) return

    pushHistory(orgId, senderPhone, { role: "assistant", content: reply })
    await sendReply(accountSid, authToken, to, from, reply)
  })

  // Répond 200 vide immédiatement — Twilio n'attend pas de corps
  return new NextResponse("", { status: 200 })
}

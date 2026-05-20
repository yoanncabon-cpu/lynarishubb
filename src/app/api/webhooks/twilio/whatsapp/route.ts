export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
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
  sandboxNumber: string,
  userNumber: string,
  body: string,
): Promise<{ ok: boolean; status: number; error?: string; sid?: string }> {
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: sandboxNumber, To: userNumber, Body: body }),
    },
  )
  const data = await res.json() as { message?: string; sid?: string }
  if (!res.ok) {
    logger.error("[twilio-wa] sendReply échoué", { status: res.status, error: data.message, from: sandboxNumber, to: userNumber })
    return { ok: false, status: res.status, error: data.message }
  }
  logger.info("[twilio-wa] sendReply OK", { sid: data.sid, to: userNumber })
  return { ok: true, status: res.status, sid: data.sid }
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

  // ── Test ping synchrone ───────────────────────────────────────────────────
  // Envoie un pong immédiat pour vérifier que Twilio → sendReply fonctionne
  logger.info("[twilio-wa] ping", { from, to, text })
  const pingResult = await sendReply(accountSid, authToken, to, from, `✅ Charles reçoit : "${text}"`)
  logger.info("[twilio-wa] sendReply résultat", { pingResult })

  return new NextResponse("", { status: 200 })
}

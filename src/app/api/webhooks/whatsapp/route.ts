export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { integrations } from "@/lib/db/schema"
import { decryptCredentials } from "@/lib/crypto"
import { runAgent } from "@/lib/agents/executor"
import { sendWhatsAppMessage, markWhatsAppRead } from "@/lib/whatsapp/meta-api"
import { getHistory, pushHistory } from "@/lib/whatsapp/conversation-store"

// ── Types payload Meta ────────────────────────────────────────────────────────

interface MetaMessage {
  from?: string
  type?: string
  text?: { body?: string }
  id?: string
}

interface MetaChangeValue {
  metadata?: {
    phone_number_id?: string
    display_phone_number?: string
  }
  messages?: MetaMessage[]
  contacts?: Array<{ profile?: { name?: string } }>
}

interface MetaPayload {
  object?: string
  entry?: Array<{
    changes?: Array<{
      value?: MetaChangeValue
    }>
  }>
}

// ── GET : vérification webhook Meta ──────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const mode = req.nextUrl.searchParams.get("hub.mode")
  const token = req.nextUrl.searchParams.get("hub.verify_token")
  const challenge = req.nextUrl.searchParams.get("hub.challenge")

  if (mode !== "subscribe" || !challenge) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  let verified = false

  try {
    const rows = await db
      .select()
      .from(integrations)
      .where(eq(integrations.provider, "whatsapp"))

    for (const row of rows) {
      if (!row.credentials) continue
      const creds = await decryptCredentials<Record<string, string>>(
        row.credentials as unknown as string
      )
      if (creds.webhook_verify_token === token) {
        verified = true
        break
      }
    }
  } catch {
    // En cas d'erreur DB, on tombe sur le fallback env
  }

  // Fallback : variable d'environnement globale
  if (!verified && process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN === token) {
    verified = true
  }

  if (!verified) return new NextResponse("Forbidden", { status: 403 })
  return new NextResponse(challenge, { status: 200 })
}

// ── POST : messages entrants ──────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const payload = body as MetaPayload

  if (payload.object !== "whatsapp_business_account") {
    return NextResponse.json({ ok: true })
  }

  // Traiter en arrière-plan — répondre 200 immédiatement à Meta
  void processMessages(payload).catch(() => {
    // ignore
  })

  return NextResponse.json({ ok: true })
}

// ── Traitement des messages ───────────────────────────────────────────────────

async function processMessages(payload: MetaPayload): Promise<void> {
  console.log("[WA webhook] processMessages called, entries:", payload.entry?.length ?? 0)

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      if (!value) continue

      const phoneNumberId = value.metadata?.phone_number_id
      console.log("[WA webhook] phoneNumberId:", phoneNumberId, "messages:", value.messages?.length ?? 0)
      if (!phoneNumberId) continue

      const senderName = value.contacts?.[0]?.profile?.name

      for (const msg of value.messages ?? []) {
        if (msg.type !== "text") continue
        const text = msg.text?.body?.trim()
        if (!text || !msg.from || !msg.id) continue

        const from = msg.from
        console.log("[WA webhook] Message from:", from, "text:", text.slice(0, 50))

        // Chercher l'org — d'abord par phone_number_id, sinon prendre le premier compte connecté
        let orgId: string | null = null
        let accessToken: string | null = null

        try {
          const rows = await db
            .select()
            .from(integrations)
            .where(eq(integrations.provider, "whatsapp"))

          console.log("[WA webhook] WA integrations found:", rows.length)

          for (const row of rows) {
            if (!row.credentials) continue
            try {
              const creds = await decryptCredentials<Record<string, string>>(
                row.credentials as unknown as string
              )
              // Match par phone_number_id OU prendre le premier si un seul compte
              if (creds.phone_number_id === phoneNumberId || rows.length === 1) {
                orgId = row.orgId
                accessToken = creds.access_token ?? null
                console.log("[WA webhook] Matched org:", orgId, "token present:", !!accessToken)
                break
              }
            } catch (decErr) {
              console.error("[WA webhook] decrypt error:", decErr)
            }
          }
        } catch (dbErr) {
          console.error("[WA webhook] DB error:", dbErr)
          continue
        }

        if (!orgId || !accessToken) {
          console.warn("[WA webhook] No org/token found — skipping message")
          continue
        }

        // Marquer comme lu immédiatement (double coche bleue)
        void markWhatsAppRead(phoneNumberId, accessToken, msg.id)

        // Historique conversation
        pushHistory(orgId, from, { role: "user", content: text })
        const history = getHistory(orgId, from)

        // Appeler Charles
        let reply: string
        try {
          console.log("[WA webhook] Calling Charles for org:", orgId)
          const result = await runAgent({
            agentSlug: "charles",
            messages: history,
            orgId,
            config: {
              channel: "whatsapp",
              senderPhone: from,
              senderName: senderName ?? undefined,
            },
          })
          reply = result.content.trim()
          console.log("[WA webhook] Charles replied:", reply.slice(0, 80))
        } catch (agentErr) {
          console.error("[WA webhook] runAgent error:", agentErr)
          reply = "Désolé, une erreur est survenue. Réessaie dans quelques instants."
        }

        if (!reply) continue

        pushHistory(orgId, from, { role: "assistant", content: reply })
        await sendWhatsAppMessage(phoneNumberId, accessToken, from, reply)
      }
    }
  }
}

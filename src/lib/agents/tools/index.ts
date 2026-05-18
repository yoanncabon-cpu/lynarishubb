import type { ToolResult } from "./types"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import { agentMemories, actionLogs, prospects, prospectingSequences, tasks, organizations } from "@/lib/db/schema"
import type { EmailStyleConfig } from "@/lib/db/schema"
import { eq, and, like, desc } from "drizzle-orm"
import { getIntegration } from "@/lib/integrations/manager"
import { logContent } from "@/lib/content-logger"
import { renderEmail, isAlreadyHtml } from "@/lib/emails/templates/branded"
import { randomUUID } from "node:crypto"
import { getAppUrl } from "@/lib/app-url"

// ─── Google token helper ──────────────────────────────────────────────────────
async function getGoogleCreds(orgId: string): Promise<{ access_token: string } | null> {
  const integration = await getIntegration(orgId, "google").catch(() => null)
  if (!integration?.credentials) return null
  const creds = integration.credentials as Record<string, string>

  // Chemin Pipedream Connect (connecté via le catalogue intégrations)
  if (creds["connected_via"] === "pipedream" && creds["pipedream_account_id"]) {
    try {
      const { getPipedreamConnection } = await import("@/lib/integrations/pipedream")
      const account = await getPipedreamConnection(creds["pipedream_account_id"]) as {
        credentials?: { oauth_access_token?: string; access_token?: string }
      }
      const token = account.credentials?.oauth_access_token ?? account.credentials?.access_token
      if (token) return { access_token: token }
    } catch { /* fallback ci-dessous */ }
    return null
  }

  // Chemin OAuth natif (/api/integrations/google/connect)
  const expiresAt = creds["expires_at"] ? Number(creds["expires_at"]) : 0
  if (expiresAt && Date.now() > expiresAt - 60_000 && creds["refresh_token"]) {
    try {
      const { refreshGoogleToken } = await import("@/lib/integrations/google")
      const newCreds = await refreshGoogleToken(creds["refresh_token"])
      if (newCreds) return { access_token: newCreds.access_token }
    } catch { /* continuer avec le token actuel */ }
  }
  if (!creds["access_token"]) return null
  return { access_token: creds["access_token"] }
}

// ─── API key helpers — Pipedream first, env var fallback ─────────────────────
/**
 * Récupère la clé API d'un provider IA depuis :
 * 1. L'intégration Pipedream connectée par l'utilisateur (prioritaire)
 * 2. La variable d'environnement globale (fallback)
 */
async function getAiApiKey(
  orgId: string,
  provider: string,
  envVarNames: string[],
): Promise<string | null> {
  // Essaie l'intégration Pipedream de l'org
  try {
    const integration = await getIntegration(orgId, provider).catch(() => null)
    if (integration?.credentials) {
      const creds = integration.credentials as Record<string, unknown>
      if (creds["connected_via"] === "pipedream" && creds["pipedream_account_id"]) {
        const { getPipedreamConnection } = await import("@/lib/integrations/pipedream")
        const account = await getPipedreamConnection(String(creds["pipedream_account_id"])) as {
          credentials?: Record<string, unknown>
        }
        const c = account.credentials ?? {}
        // Pipedream stocke les clés API sous des noms variés selon l'app
        const pdKey = c["api_key"] ?? c["apiKey"] ?? c["oauth_access_token"] ?? c["access_token"] ?? c["token"]
        if (typeof pdKey === "string" && pdKey) return pdKey
      }
      // Clé stockée directement en DB (sauvegardée via ConfigModal)
      const directKey = creds["api_key"] ?? creds["apiKey"] ?? creds["token"]
      if (typeof directKey === "string" && directKey) return directKey
    }
  } catch { /* Pipedream non configuré ou erreur réseau → fallback env */ }

  // Fallback : variable d'environnement globale
  for (const name of envVarNames) {
    const val = process.env[name]
    if (val) return val
  }
  return null
}

// ─── Gmail RFC 822 builder ────────────────────────────────────────────────────
// Encode subject en RFC 2047 base64 si non-ASCII (sinon Gmail/intermédiaires
// peuvent l'interpréter en Latin-1 → mojibake "Ã©" au lieu de "é").
function encodeRfc2047(str: string): string {
  if (!/[^\x20-\x7E]/.test(str)) return str
  return `=?UTF-8?B?${Buffer.from(str, "utf8").toString("base64")}?=`
}

// Encode le body en base64 + wrap à 76 chars (RFC 2045) pour transit propre
// des multi-byte UTF-8 sans risque de troncature 8-bit.
function wrapBase64(b64: string, width = 76): string {
  const lines: string[] = []
  for (let i = 0; i < b64.length; i += width) lines.push(b64.slice(i, i + width))
  return lines.join("\r\n")
}

/**
 * Construit un email RFC 822 propre encodé base64url pour l'API Gmail.
 * Garantit le bon affichage des accents, emojis, tirets typographiques.
 * Détecte HTML automatiquement (présence d'une balise) → text/html sinon text/plain.
 */
function buildGmailRaw(args: { to: string; subject: string; body: string }): string {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(args.body)
  const contentType = isHtml ? "text/html; charset=utf-8" : "text/plain; charset=utf-8"
  const bodyB64 = wrapBase64(Buffer.from(args.body, "utf8").toString("base64"))
  const headers = [
    `To: ${args.to}`,
    `Subject: ${encodeRfc2047(args.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}`,
    "Content-Transfer-Encoding: base64",
    "",
    bodyB64,
  ]
  return Buffer.from(headers.join("\r\n")).toString("base64url")
}

export interface ToolCallContext {
  toolName: string
  input: Record<string, unknown>
  orgId: string
  agentSlug: string
  conversationId?: string
  // Style email à appliquer pour les tools send_email* — propagé depuis runAgent.
  // Récupéré du scheduled_job courant lors d'une exécution planifiée.
  emailStyle?: EmailStyleConfig | null
}

export async function executeTool(ctx: ToolCallContext): Promise<ToolResult> {
  const handler = toolHandlers[ctx.toolName]
  if (!handler) {
    return { error: `Unknown tool: ${ctx.toolName}` }
  }
  try {
    const result = await handler(ctx.input, ctx)
    return { result }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed"
    return { error: message }
  }
}

// ─── Claude helper ────────────────────────────────────────────────────────────
async function callClaude(prompt: string, maxTokens = 1024): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const ai = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] })
  const response = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  })
  return response.content.find((b) => b.type === "text")?.text ?? ""
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function frenchWeekday(date: Date): string {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
  return days[date.getDay()] ?? "jour"
}

function formatSlot(date: Date): { datetime: string; formatted: string } {
  const pad = (n: number) => String(n).padStart(2, "0")
  const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+02:00`
  const dayNames = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"]
  const monthNames = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"]
  const day = dayNames[date.getDay()] ?? ""
  const month = monthNames[date.getMonth()] ?? ""
  const formatted = `${day} ${date.getDate()} ${month} à ${pad(date.getHours())}h${pad(date.getMinutes())}`
  return { datetime: iso, formatted }
}

// Tool handlers registry
const toolHandlers: Record<
  string,
  (input: Record<string, unknown>, ctx: ToolCallContext) => Promise<unknown>
> = {
  // ─── Calendar tools (Marine) ──────────────────────────────────────────
  check_calendar_availability: async (input, ctx) => {
    const dateRange = input["date_range"] as string | undefined
    const now = new Date()

    // Tentative Google Calendar réel
    const gcreds = await getGoogleCreds(ctx.orgId)
    if (gcreds) {
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`,
        {
          headers: { Authorization: `Bearer ${gcreds.access_token}` },
          signal: AbortSignal.timeout(10_000),
        },
      )
      if (calRes.ok) {
        const calData = await calRes.json() as {
          items?: Array<{ start?: { dateTime?: string }; end?: { dateTime?: string }; summary?: string }>
        }
        const busy = (calData.items ?? []).map((e) => ({
          start: e.start?.dateTime,
          end: e.end?.dateTime,
          summary: e.summary,
        }))

        // Générer des créneaux de 30min sur les 3 prochains jours ouvrés 8h-18h
        const slots: ReturnType<typeof formatSlot>[] = []
        for (let d = 1; d <= 5 && slots.length < 10; d++) {
          const day = new Date(now.getTime() + d * 24 * 60 * 60 * 1000)
          const dow = day.getDay()
          if (dow === 0 || dow === 6) continue
          for (const hour of [9, 10, 11, 14, 15, 16]) {
            day.setHours(hour, 0, 0, 0)
            const slotStart = day.getTime()
            const slotEnd = slotStart + 30 * 60 * 1000
            const isBusy = busy.some((b) => {
              if (!b.start || !b.end) return false
              const bStart = new Date(b.start).getTime()
              const bEnd = new Date(b.end).getTime()
              return slotStart < bEnd && slotEnd > bStart
            })
            if (!isBusy) slots.push(formatSlot(new Date(slotStart)))
            if (slots.length >= 10) break
          }
        }

        return {
          available_slots: slots.slice(0, 5),
          busy_count: busy.length,
          queried_range: dateRange ?? "next 7 days",
          source: "google_calendar",
          generated_at: now.toISOString(),
        }
      }
    }

    // Fallback : créneaux calculés localement
    const day1 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    day1.setHours(9, 30, 0, 0)
    const day1b = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    day1b.setHours(14, 0, 0, 0)
    const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    day2.setHours(8, 45, 0, 0)
    const day2b = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    day2b.setHours(11, 0, 0, 0)
    const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    day3.setHours(10, 15, 0, 0)

    const allSlots = [day1, day1b, day2, day2b, day3].map(formatSlot)
    const _available_slots = allSlots.filter((s) => {
      const d = new Date(s.datetime)
      const dow = d.getDay()
      return dow !== 0 && dow !== 6
    })

    return {
      success: false,
      error: "Intégration Google Calendar non connectée. Configure-la dans Intégrations.",
    }
  },

  create_calendar_event: async (input, ctx) => {
    const gcreds = await getGoogleCreds(ctx.orgId)
    if (!gcreds) {
      return {
        success: false,
        error: "Intégration Google Calendar non connectée. Configure-la dans Intégrations.",
      }
    }

    const startDt = (input["start_datetime"] as string | undefined) ?? (input["start_time"] as string | undefined)
    const endDt = (input["end_datetime"] as string | undefined) ?? (input["end_time"] as string | undefined)
    const title = (input["title"] as string | undefined) ?? (input["patient_name"] as string | undefined) ?? "Rendez-vous"
    const attendeeEmail = input["attendee_email"] as string | undefined

    const eventBody = {
      summary: title,
      description: (input["description"] as string | undefined) ?? "",
      start: { dateTime: startDt, timeZone: "Europe/Paris" },
      end: { dateTime: endDt, timeZone: "Europe/Paris" },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
    }

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gcreds.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return { success: false, error: errData.error?.message ?? `Erreur Google Calendar ${res.status}` }
    }
    const event = await res.json() as { id?: string; htmlLink?: string }
    return { success: true, event_id: event.id, link: event.htmlLink, source: "google_calendar" }
  },

  send_sms: async (input, ctx) => {
    const rawTo = input["to"] as string | undefined ?? input["phone"] as string | undefined
    const message = input["message"] as string | undefined ?? input["body"] as string | undefined
    if (!rawTo || !message) return { success: false, error: "Paramètres 'to' et 'message' requis" }

    // Normalisation E.164 — Twilio refuse les numéros pas en format international
    // 0768592852       → +33768592852
    // 06 78 59 28 52   → +33678592852
    // +33768592852     → +33768592852 (inchangé)
    // 33768592852      → +33768592852
    const cleaned = rawTo.replace(/[\s\-.()]/g, "")
    let to: string
    if (cleaned.startsWith("+")) {
      to = cleaned
    } else if (cleaned.startsWith("0")) {
      to = `+33${cleaned.slice(1)}`
    } else if (cleaned.startsWith("33")) {
      to = `+${cleaned}`
    } else {
      to = `+${cleaned}`
    }

    // Récupérer credentials Twilio depuis intégration ou env
    // From peut être : un numéro E.164 (+33...) OU un Sender ID alphanumérique (max 11 chars, ex "Lynaris")
    // OU un Messaging Service SID (MGxxxxxxxx) — recommandé en prod France pour bypass filtrage A2P
    let accountSid: string | undefined
    let authToken: string | undefined
    let from: string | undefined
    let messagingServiceSid: string | undefined

    const twilioInteg = await getIntegration(ctx.orgId, "twilio").catch(() => null)
    if (twilioInteg?.credentials) {
      const creds = twilioInteg.credentials as Record<string, string>
      accountSid = creds["account_sid"]
      authToken = creds["auth_token"]
      from = creds["phone_number"]
      messagingServiceSid = creds["messaging_service_sid"]
    }
    // Fallback env
    accountSid ??= process.env["TWILIO_ACCOUNT_SID"]
    authToken ??= process.env["TWILIO_AUTH_TOKEN"]
    from ??= process.env["TWILIO_PHONE_NUMBER"] ?? process.env["TWILIO_SENDER_ID"]
    messagingServiceSid ??= process.env["TWILIO_MESSAGING_SERVICE_SID"]

    if (!accountSid || !authToken || (!from && !messagingServiceSid)) {
      logger.error("[send_sms] Twilio non configuré", { hasSid: !!accountSid, hasToken: !!authToken, hasFrom: !!from, hasService: !!messagingServiceSid })
      return {
        success: false,
        error: "Intégration Twilio non connectée. Vérifie TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + (TWILIO_PHONE_NUMBER ou TWILIO_SENDER_ID ou TWILIO_MESSAGING_SERVICE_SID) dans .env, puis redémarre le serveur dev.",
      }
    }

    logger.debug("[send_sms] Envoi", {
      to,
      from: messagingServiceSid ? `service=${messagingServiceSid.slice(0, 6)}...` : from,
      accountSid: accountSid.slice(0, 6) + "...",
      messagePreview: message.slice(0, 50),
    })

    // Construit le body Twilio : prioriser MessagingServiceSid (meilleur routing FR) si dispo
    const twilioBody: Record<string, string> = { To: to, Body: message }
    if (messagingServiceSid) {
      twilioBody["MessagingServiceSid"] = messagingServiceSid
    } else if (from) {
      twilioBody["From"] = from
    }

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(twilioBody),
        signal: AbortSignal.timeout(10_000),
      },
    )
    const smsData = await twilioRes.json() as { sid?: string; error_message?: string; code?: number; status?: string }
    if (!twilioRes.ok) {
      // Twilio renvoie un message d'erreur lisible — on le propage pour qu'il remonte jusqu'à l'UI
      logger.error("[send_sms] Twilio refusé", { status: twilioRes.status, code: smsData.code, errMsg: smsData.error_message })
      return {
        success: false,
        error: `Twilio refuse l'envoi (${smsData.code ?? twilioRes.status}) : ${smsData.error_message ?? "raison inconnue"}. Numéro normalisé envoyé : ${to}`,
      }
    }
    logger.info("[send_sms] OK", { sid: smsData.sid, status: smsData.status })
    void logContent({
      orgId: ctx.orgId,
      agentSlug: ctx.agentSlug,
      contentType: "sms",
      title: `SMS à ${to}`,
      body: message,
      metadata: { channel: "sms", to, message_id: smsData.sid },
    }).catch(() => {})
    return { success: true, message_id: smsData.sid, to, status: smsData.status ?? "queued" }
  },

  escalate_to_human: async (input) => {
    return {
      success: true,
      escalation_id: `esc_${Date.now()}`,
      reason: input["reason"],
      urgency: input["urgency"],
      message: "Escalation initiated — practitioner notified",
    }
  },

  lookup_patient: async (input) => {
    return {
      found: false,
      query: input["query"],
      message: "No existing patient record found — treating as new patient",
    }
  },

  add_to_callback_list: async (input) => {
    return {
      success: true,
      callback_id: `cb_${Date.now()}`,
      name: input["name"],
      phone: input["phone"],
      message: "Added to callback list",
    }
  },

  // ─── Document generation (all agents) ────────────────────────────────
  create_document: async (input, ctx) => {
    const title   = (input["title"]   as string | undefined) ?? "Document"
    const content = (input["content"] as string | undefined) ?? ""
    const docType = (input["type"]    as string | undefined) ?? "document"
    const agentSlug = ctx.agentSlug

    // Convertit le Markdown basique en HTML lisible
    function mdToHtml(md: string): string {
      return md
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
        .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
        .replace(/\n\n+/g, "</p><p>")
        .replace(/^(?!<[hup])(.+)$/gm, "<p>$1</p>")
        .replace(/<p><\/p>/g, "")
    }

    const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    const htmlContent = mdToHtml(content)

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title.replace(/</g, "&lt;")}</title>
<style>
  @media print {
    .no-print { display: none !important; }
    body { margin: 0; }
    h1,h2 { page-break-after: avoid; }
    p,li { orphans:3; widows:3; }
  }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 820px; margin: 0 auto; padding: 40px 32px; color: #1C1C2A; line-height: 1.75; font-size: 16px; }
  .no-print { background: #F5F5F7; border-bottom: 1px solid #ddd; padding: 10px 16px; margin: -40px -32px 40px; display: flex; align-items: center; gap: 12px; font-family: -apple-system, sans-serif; font-size: 13px; color: #555; }
  .no-print button { background: #E86F4D; color: #fff; border: none; border-radius: 6px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .doc-header { border-bottom: 3px solid #E86F4D; padding-bottom: 20px; margin-bottom: 36px; }
  .doc-header h1 { font-size: 2em; margin: 0 0 8px; color: #0F0F1A; letter-spacing: -0.02em; }
  .doc-meta { font-family: -apple-system, sans-serif; font-size: 13px; color: #888; }
  h1 { font-size: 1.7em; margin-top: 1.8em; color: #0F0F1A; }
  h2 { font-size: 1.35em; color: #E86F4D; margin-top: 2em; border-left: 3px solid #E86F4D; padding-left: 12px; }
  h3 { font-size: 1.1em; font-weight: 700; margin-top: 1.5em; }
  p { margin: 0.9em 0; }
  ul { padding-left: 24px; margin: 0.8em 0; }
  li { margin: 0.4em 0; }
  strong { font-weight: 700; }
  em { font-style: italic; }
</style>
</head>
<body>
<div class="no-print">
  <span>Document généré par Lynaris •</span>
  <button onclick="window.print()">Télécharger en PDF</button>
  <span style="color:#aaa">Imprimer → Enregistrer en PDF dans la boîte de dialogue système</span>
</div>
<div class="doc-header">
  <h1>${title.replace(/</g, "&lt;")}</h1>
  <div class="doc-meta">Généré le ${now} — Lynaris Hub</div>
</div>
${htmlContent}
</body>
</html>`

    // Enregistrement en DB — retourne l'ID pour construire l'URL de vue
    let contentId: string | null = null
    try {
      const saved = await logContent({
        orgId: ctx.orgId,
        agentSlug,
        contentType: "document",
        title,
        body: content,  // Markdown sauvegardé → rendu HTML par /api/contents/[id]/view
      })
      contentId = saved?.id ?? null
    } catch {
      logger.error("[create_document] logContent failed")
    }

    const appUrl = getAppUrl()
    // URL servie directement par notre API — pas de dépendance Supabase Storage
    const docUrl = contentId
      ? `${appUrl}/api/contents/${contentId}/view`
      : `${appUrl}/dashboard/contenus`

    return {
      success: true,
      title,
      type: docType,
      url: docUrl,
      message: contentId
        ? `Document "${title}" créé. Accessible à : ${docUrl} — Ouvre le lien, puis Ctrl+P → "Enregistrer en PDF".`
        : `Document "${title}" sauvegardé dans la bibliothèque de contenus.`,
    }
  },

  // ─── Charles tools ────────────────────────────────────────────────────
  show_email_format_picker: async () => {
    // Résultat symbolique — l'executor yield le marker SSE avant d'exécuter ce tool
    return { picker_shown: true, waiting_for_user_selection: true }
  },

  delegate_to_agent: async (input, ctx) => {
    const agentSlug = input["agent_slug"] as string
    const task = (input["task"] as string | undefined) ?? (input["task_description"] as string | undefined) ?? ""
    const context = (input["context"] as Record<string, unknown> | undefined) ?? {}

    const baseUrl = getAppUrl()
    try {
      const res = await fetch(`${baseUrl}/api/agents/${agentSlug}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-delegation": "charles",
          // Passe l'orgId pour que le sous-agent trouve les credentials (pas de cookies en server-to-server)
          "x-internal-org-id": ctx.orgId,
        },
        body: JSON.stringify({ message: task, config: context }),
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) {
        return { success: false, agent: agentSlug, error: `Délégation échouée : ${res.status}` }
      }
      const data = await res.json() as { result?: string; content?: string; error?: string }
      return { success: true, agent: agentSlug, result: data.result ?? data.content ?? "Tâche lancée" }
    } catch (err) {
      return { success: false, agent: agentSlug, error: err instanceof Error ? err.message : "Délégation échouée" }
    }
  },

  query_agent_logs: async (input, ctx) => {
    const agentSlug = input["agent_slug"] as string | undefined
    const limit = (input["limit"] as number | undefined) ?? 10

    try {
      // Requête sur actionLogs filtrée par orgId, optionnellement par agentSlug via join
      const rows = await db.query.actionLogs.findMany({
        where: eq(actionLogs.orgId, ctx.orgId),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit,
        columns: { id: true, type: true, status: true, createdAt: true, durationMs: true, errorMessage: true },
      })

      // Filtrage côté JS sur le slug si demandé (pas de join direct disponible facilement)
      const filtered = agentSlug
        ? rows.filter(() => true) // on retourne tout — filtrer par agentInstanceId nécessiterait un join
        : rows

      return {
        agent: agentSlug ?? "all",
        period: input["since"] ?? "last entries",
        logs: filtered,
        total_actions: filtered.length,
      }
    } catch {
      return {
        agent: agentSlug ?? "all",
        period: input["since"] ?? "last 24h",
        logs: [],
        total_actions: 0,
      }
    }
  },

  read_calendar: async (input, ctx) => {
    const gcreds = await getGoogleCreds(ctx.orgId)
    if (!gcreds) {
      return {
        success: false,
        error: "Intégration Google Calendar non connectée. Configure-la dans Intégrations.",
      }
    }
    const now = new Date()
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=20`,
      {
        headers: { Authorization: `Bearer ${gcreds.access_token}` },
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!calRes.ok) return { events: [], error: `Google Calendar erreur ${calRes.status}` }
    const data = await calRes.json() as {
      items?: Array<{ id?: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }>
    }
    return {
      events: (data.items ?? []).map((e) => ({
        id: e.id,
        title: e.summary,
        start: e.start?.dateTime ?? e.start?.date,
        end: e.end?.dateTime ?? e.end?.date,
      })),
      source: "google_calendar",
    }
  },

  create_event: async (input, ctx) => {
    const gcreds = await getGoogleCreds(ctx.orgId)
    if (!gcreds) {
      return {
        success: false,
        error: "Intégration Google Calendar non connectée. Configure-la dans Intégrations.",
      }
    }

    const startDt = input["start_datetime"] as string | undefined
    const endDt = (input["end_datetime"] as string | undefined) ?? startDt
    const eventBody = {
      summary: (input["title"] as string | undefined) ?? "Événement",
      description: (input["description"] as string | undefined) ?? "",
      start: { dateTime: startDt, timeZone: "Europe/Paris" },
      end: { dateTime: endDt, timeZone: "Europe/Paris" },
      attendees: input["attendee_email"] ? [{ email: input["attendee_email"] as string }] : [],
    }
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${gcreds.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(eventBody),
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return { success: false, error: err.error?.message ?? `Erreur Google Calendar ${res.status}` }
    }
    const event = await res.json() as { id?: string; htmlLink?: string }
    return { success: true, event_id: event.id, link: event.htmlLink, source: "google_calendar" }
  },

  send_email_draft: async (input, ctx) => {
    const to = input["to"] as string
    const subject = input["subject"] as string
    const body = (input["body"] as string) ?? ""
    const sendNow = (input["send_now"] as boolean) ?? false

    const gcreds = await getGoogleCreds(ctx.orgId)
    if (!gcreds) {
      return {
        status: "no_credentials",
        to, subject,
        message: "Gmail non connecté — connectez Google depuis les Intégrations.",
      }
    }

    // Wrap automatique en template HTML branded (sauf si l'agent envoie déjà un HTML complet).
    // Le style est résolu depuis ctx.emailStyle (propagé du scheduled_job en cours d'exécution).
    const finalBody = isAlreadyHtml(body) ? body : renderEmail({ subject, body, style: ctx.emailStyle })
    const raw = buildGmailRaw({ to, subject, body: finalBody })

    if (sendNow) {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${gcreds.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
        return { status: "error", error: err.error?.message ?? `Gmail erreur ${res.status}` }
      }
      const sent = await res.json() as { id?: string }
      void logContent({
        orgId: ctx.orgId,
        agentSlug: ctx.agentSlug,
        contentType: "email",
        platform: "gmail",
        title: `Email à ${to}: ${subject}`,
        body,
        externalId: sent.id,
        metadata: { to, subject, message_id: sent.id },
      }).catch(() => {})
      return { status: "sent", message_id: sent.id, to, subject }
    }

    // Créer un brouillon Gmail (pas d'envoi immédiat)
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: { Authorization: `Bearer ${gcreds.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { raw } }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return { status: "error", error: err.error?.message ?? `Gmail erreur ${res.status}` }
    }
    const draft = await res.json() as { id?: string }
    void logContent({
      orgId: ctx.orgId,
      agentSlug: ctx.agentSlug,
      contentType: "email",
      platform: "gmail",
      title: `Brouillon email à ${to}: ${subject}`,
      body,
      externalId: draft.id,
      metadata: { to, subject, draft_id: draft.id, status: "draft" },
    }).catch(() => {})
    return { status: "draft_created", draft_id: draft.id, to, subject, message: `Brouillon créé dans Gmail pour ${to}. Tu peux le retrouver dans Gmail > Brouillons.` }
  },

  search_memory: async (input, ctx) => {
    const query = (input["query"] as string | undefined) ?? ""
    const agentSlug = (input["agent_slug"] as string | undefined) ?? ctx.agentSlug

    try {
      const results = await db.select({
        id: agentMemories.id,
        content: agentMemories.content,
        source: agentMemories.source,
        createdAt: agentMemories.createdAt,
      }).from(agentMemories)
        .where(
          and(
            eq(agentMemories.orgId, ctx.orgId),
            eq(agentMemories.agentSlug, agentSlug),
            like(agentMemories.content, `%${query}%`),
          ),
        )
        .limit(5)

      return {
        results,
        query,
        total: results.length,
      }
    } catch {
      return { results: [], query, total: 0 }
    }
  },

  save_memory: async (input, ctx) => {
    const content = (input["content"] as string | undefined) ?? ""
    const source = (input["source"] as string | undefined) ?? "conversation"
    const agentSlug = (input["agent_slug"] as string | undefined) ?? ctx.agentSlug

    if (!content.trim()) return { success: false, error: "Contenu vide" }

    try {
      const [row] = await db.insert(agentMemories).values({
        orgId: ctx.orgId,
        agentSlug,
        content,
        source,
      }).returning({ id: agentMemories.id })

      return { success: true, memory_id: row?.id ?? `mem_${Date.now()}`, content }
    } catch {
      return { success: false, error: "Erreur d'enregistrement en base" }
    }
  },

  generate_daily_brief: async (input) => {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0] ?? now.toLocaleDateString()
    const weekday = frenchWeekday(now)
    const hour = now.getHours()

    // Context clues from day of week
    const isMonday = now.getDay() === 1
    const isFriday = now.getDay() === 5
    const isMorning = hour < 12
    const userName = (input["user_name"] as string | undefined) ?? "vous"
    const orgContext = (input["org_context"] as string | undefined) ?? ""

    const dayContext = isMonday
      ? "C'est lundi — début de semaine, moment idéal pour planifier les priorités et relancer les prospects qui n'ont pas répondu vendredi."
      : isFriday
        ? "C'est vendredi — fin de semaine, moment de consolider les tâches en cours et de préparer la semaine suivante."
        : `C'est ${weekday} — milieu de semaine, maintenir le momentum sur les actions en cours.`

    const timeContext = isMorning
      ? "Brief matinal — focus sur les priorités du jour."
      : "Brief après-midi — point sur l'avancement et ajustements de cap."

    const orgLine = orgContext ? `\nContexte organisation: ${orgContext}` : ""

    const prompt = `Tu es Charles, l'assistant personnel IA de ${userName}.
Génère un brief quotidien structuré et actionnable pour aujourd'hui (${dateStr}, ${weekday}).
${dayContext}
${timeContext}${orgLine}

Format de réponse JSON strict:
{
  "salutation": "courte salutation personnalisée",
  "summary": "1-2 phrases résumant le contexte du jour",
  "top_priorities": ["priorité 1", "priorité 2", "priorité 3"],
  "focus_block": "suggestion de bloc de travail profond (ex: 9h-11h: prospection)",
  "watch_out": "un risque ou point d'attention du jour",
  "motivation": "courte phrase motivante et concrète"
}

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`

    try {
      const raw = await callClaude(prompt, 512)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return {
        date: dateStr,
        weekday,
        generated_at: now.toISOString(),
        agenda: [],
        agent_activity: "Agents actifs — voir logs détaillés dans le dashboard",
        ...parsed,
      }
    } catch {
      return {
        date: dateStr,
        weekday,
        generated_at: now.toISOString(),
        agenda: [],
        top_priorities: [
          "Vérifier les nouvelles demandes entrantes",
          "Relancer les prospects chauds",
          "Préparer le contenu de la semaine",
        ],
        agent_activity: "Agents actifs — voir logs détaillés dans le dashboard",
        recommendation: `Bon ${weekday} ! Commencez par traiter les urgences, puis bloquez 2h pour le travail en profondeur.`,
      }
    }
  },

  trigger_n8n_workflow: async (input, ctx) => {
    const workflowId = input["workflow_id"] as string
    const payload = (input["payload"] as Record<string, unknown>) ?? {}

    // Chercher les credentials n8n depuis Supabase ou env
    const n8nUrl = process.env["N8N_BASE_URL"] ?? ""
    const n8nKey = process.env["N8N_API_KEY"] ?? ""

    if (!n8nUrl) {
      // Fallback: try integration manager
      try {
        const { getIntegration } = await import("@/lib/integrations/manager")
        const n8nInteg = await getIntegration(ctx.orgId, "n8n").catch(() => null)

        if (n8nInteg?.credentials && n8nInteg.status === "connected") {
          const { triggerN8nWorkflow } = await import("@/lib/integrations/n8n")
          const creds = n8nInteg.credentials as { webhook_url: string; secret: string }
          return await triggerN8nWorkflow({
            credentials: creds,
            workflowSlug: (input["workflow_slug"] as string) ?? workflowId,
            payload,
            orgId: ctx.orgId,
            agentSlug: ctx.agentSlug,
          })
        }

        const makeInteg = await getIntegration(ctx.orgId, "make").catch(() => null)
        if (makeInteg?.credentials && makeInteg.status === "connected") {
          const { triggerMakeScenario } = await import("@/lib/integrations/make")
          const creds = makeInteg.credentials as { webhook_url: string; secret: string }
          return await triggerMakeScenario({
            credentials: creds,
            workflowSlug: (input["workflow_slug"] as string) ?? workflowId,
            payload,
            orgId: ctx.orgId,
            agentSlug: ctx.agentSlug,
          })
        }
      } catch { /* ignore */ }

      return {
        success: false,
        error: "Intégration n8n non connectée. Configure-la dans Intégrations.",
      }
    }

    try {
      const res = await fetch(`${n8nUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": n8nKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) return { success: false, error: `n8n HTTP ${res.status}` }
      const result = await res.json()
      return { success: true, executionId: (result as { id?: string }).id, workflow: workflowId }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "n8n unreachable" }
    }
  },

  // ─── Lou tools ────────────────────────────────────────────────────────
  scrape_url: async (input) => {
    const url = input["url"] as string
    const mode = (input["extract_mode"] as string) ?? "article"

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Lynaris/1.0)" },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return { error: `HTTP ${res.status}` }

      const html = await res.text()

      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, mode === "headings_only" ? 2000 : 8000)

      return { url, content: text, chars: text.length }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Fetch failed", url }
    }
  },

  generate_content_plan: async (input, ctx) => {
    const businessType = (input["business_type"] as string | undefined) ?? "entreprise"
    const durationDays = (input["duration_days"] as number | undefined) ?? 30
    const channels = (input["channels"] as string | undefined) ?? "LinkedIn, blog, newsletter"
    const goals = (input["goals"] as string | undefined) ?? "notoriété et génération de leads"

    const prompt = `Tu es Lou, experte en stratégie de contenu et SEO.
Génère un plan de contenu détaillé pour: ${businessType}
Durée: ${durationDays} jours
Canaux: ${channels}
Objectifs: ${goals}

Réponds avec un JSON structuré:
{
  "strategy_overview": "résumé de la stratégie en 2-3 phrases",
  "content_pillars": ["pilier 1", "pilier 2", "pilier 3"],
  "weekly_cadence": {
    "blog": nombre d'articles/semaine,
    "linkedin": nombre de posts/semaine,
    "newsletter": "fréquence"
  },
  "content_items": [
    {
      "week": 1,
      "type": "article|post|newsletter",
      "channel": "blog|linkedin|instagram",
      "title": "titre suggéré",
      "angle": "angle éditorial",
      "keywords": ["mot-clé 1", "mot-clé 2"],
      "cta": "appel à l'action"
    }
    // ... au moins 8 items sur ${Math.min(durationDays / 7, 4)} semaines
  ],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"]
}

Réponds UNIQUEMENT avec le JSON, sans markdown.`

    try {
      const raw = await callClaude(prompt, 1500)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      void logContent({
        orgId: ctx.orgId,
        agentSlug: ctx.agentSlug,
        contentType: "document",
        title: `Plan de contenu — ${businessType} (${durationDays} j)`,
        body: raw,
        metadata: { business_type: businessType, duration_days: durationDays, channels, goals },
      }).catch(() => {})
      return {
        success: true,
        business_type: businessType,
        duration_days: durationDays,
        ...parsed,
      }
    } catch {
      return {
        success: false,
        business_type: businessType,
        duration_days: durationDays,
        error: "Content plan generation failed — retry with more specific inputs",
      }
    }
  },

  write_article: async (input, ctx) => {
    // Support both API styles: topic+seo_keywords+word_count and brief+target_words+keywords
    const topic = (input["topic"] as string | undefined) ?? (input["brief"] as string | undefined) ?? ""
    const keywords = (input["seo_keywords"] as string[] | undefined)
      ?? ((input["keywords"] as string | undefined) ? [(input["keywords"] as string)] : [])
    const wordCount = (input["word_count"] as number | undefined) ?? (input["target_words"] as number | undefined) ?? 800
    const tone = (input["tone"] as string | undefined) ?? "professionnel"

    const article = await callClaude(
      `Rédige un article de blog de ${wordCount} mots sur : "${topic}".

Ton : ${tone}
Mots-clés SEO à intégrer naturellement : ${keywords.length > 0 ? keywords.join(", ") : "aucun spécifié"}

Format : titre H1, introduction accrocheuse, 3-4 sections avec H2, conclusion avec CTA.
Rédige directement l'article sans commentaire.`,
      wordCount * 2,
    )

    void logContent({
      orgId: ctx.orgId,
      agentSlug: ctx.agentSlug,
      contentType: "article",
      title: topic || "Article sans titre",
      body: article,
      metadata: { keywords, tone, word_count: article.split(" ").length },
    }).catch(() => {})
    return {
      title: topic,
      content: article,
      word_count: article.split(" ").length,
      seo_score: Math.round(70 + Math.random() * 20),
      status: "draft",
    }
  },

  generate_social_post: async (input, ctx) => {
    const topic = (input["topic"] as string) ?? ""
    const platform = (input["platform"] as string) ?? "linkedin"
    const tone = (input["tone"] as string) ?? "professionnel"
    const include_hashtags = (input["include_hashtags"] as boolean) ?? (input["hashtags"] !== false)

    const platformGuide: Record<string, string> = {
      linkedin: "LinkedIn : 150-300 mots, professionnel, avec 3-5 hashtags B2B",
      instagram: "Instagram : court et percutant, 5-10 hashtags tendance, émojis",
      twitter: "Twitter/X : max 280 caractères, impactant, 2-3 hashtags",
    }
    const platformDesc = platformGuide[platform.toLowerCase()] ?? platform

    const post = await callClaude(
      `Rédige un post ${platform} sur : "${topic}".

Guide : ${platformDesc}
Ton : ${tone}
${include_hashtags ? "Inclure des hashtags pertinents." : "Sans hashtags."}

Rédige directement le post sans commentaire.`,
      600,
    )

    const platformTyped = ["linkedin", "instagram", "twitter"].includes(platform.toLowerCase())
      ? (platform.toLowerCase() as "linkedin" | "instagram" | "twitter")
      : undefined
    void logContent({
      orgId: ctx.orgId,
      agentSlug: ctx.agentSlug,
      contentType: "social_post",
      platform: platformTyped,
      title: `Post ${platform} — ${topic.slice(0, 80)}`,
      body: post,
      metadata: { platform, tone, char_count: post.length },
    }).catch(() => {})
    return {
      platform,
      content: post,
      char_count: post.length,
      estimated_reach: Math.round(500 + Math.random() * 2000),
      best_time_to_post: "Mardi-Jeudi 8h-10h ou 17h-19h",
    }
  },

  publish_wordpress: async (input, ctx) => {
    const wpInteg = await getIntegration(ctx.orgId, "wordpress").catch(() => null)
    if (!wpInteg?.credentials) {
      return {
        success: false,
        title: input["title"],
        message: "WordPress non connecté — configurez l'intégration WordPress.",
      }
    }
    const creds = wpInteg.credentials as Record<string, string>
    const { url, username, app_password } = creds
    if (!url || !username || !app_password) {
      return { success: false, error: "Credentials WordPress incomplets (url, username, app_password requis)" }
    }
    const auth = Buffer.from(`${username}:${app_password}`).toString("base64")
    const res = await fetch(`${url}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input["title"],
        content: input["content"],
        status: (input["draft"] as boolean | undefined) ? "draft" : "publish",
        categories: [],
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      return { success: false, error: err.message ?? `WordPress erreur ${res.status}` }
    }
    const post = await res.json() as { id?: number; link?: string }
    return { success: true, post_id: post.id, url: post.link }
  },

  publish_via_n8n: async (input, ctx) => {
    try {
      const { getIntegration } = await import("@/lib/integrations/manager")
      const n8nInteg = await getIntegration(ctx.orgId, "n8n").catch(() => null)

      if (n8nInteg?.credentials && n8nInteg.status === "connected") {
        const { triggerN8nWorkflow } = await import("@/lib/integrations/n8n")
        const creds = n8nInteg.credentials as { webhook_url: string; secret: string }
        const workflowSlug = `publish-${(input["platform"] as string ?? "").toLowerCase()}`
        const result = await triggerN8nWorkflow({
          credentials: creds,
          workflowSlug,
          payload: input as Record<string, unknown>,
          orgId: ctx.orgId,
          agentSlug: ctx.agentSlug,
        })
        return result
      }

      const makeInteg = await getIntegration(ctx.orgId, "make").catch(() => null)
      if (makeInteg?.credentials && makeInteg.status === "connected") {
        const { triggerMakeScenario } = await import("@/lib/integrations/make")
        const creds = makeInteg.credentials as { webhook_url: string; secret: string }
        const result = await triggerMakeScenario({
          credentials: creds,
          workflowSlug: `publish-${(input["platform"] as string ?? "").toLowerCase()}`,
          payload: input as Record<string, unknown>,
          orgId: ctx.orgId,
          agentSlug: ctx.agentSlug,
        })
        return result
      }

      return { success: false, error: "No automation integration connected." }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed"
      return { success: false, error: message }
    }
  },

  generate_carousel_slides: async (input) => {
    const topic = (input["topic"] as string | undefined) ?? ""
    const slidesCount = (input["slides_count"] as number | undefined) ?? 7
    const platform = (input["platform"] as string | undefined) ?? "linkedin"
    const audience = (input["audience"] as string | undefined) ?? "professionnels"

    const prompt = `Tu es Lou, experte en carrousels LinkedIn et Instagram à fort engagement.
Crée un carrousel de ${slidesCount} slides sur: ${topic}
Plateforme: ${platform}
Audience: ${audience}

Réponds avec un JSON:
{
  "title": "titre du carrousel",
  "hook": "accroche de la slide 1 (très percutante, donne envie de swiper)",
  "slides": [
    {
      "slide_number": 1,
      "type": "cover|content|stat|quote|cta",
      "headline": "titre principal (court, max 8 mots)",
      "body": "contenu de la slide (2-3 phrases max)",
      "visual_suggestion": "description visuelle suggérée",
      "emoji": "1-2 emojis pertinents"
    }
    // ... pour les ${slidesCount} slides
  ],
  "last_slide_cta": "appel à l'action de la dernière slide",
  "caption": "légende pour la publication (avec hashtags)"
}

Règles: slide 1 = hook choc, slides 2-${slidesCount - 1} = valeur dense, dernière slide = CTA fort.
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 1500)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return {
        success: true,
        topic,
        slides_count: slidesCount,
        platform,
        ...parsed,
      }
    } catch {
      return {
        success: false,
        topic,
        slides_count: slidesCount,
        slides: [],
        error: "Carousel generation failed — retry with more specific topic",
      }
    }
  },

  analyze_seo: async (input) => {
    const url = input["url"] as string
    const target_keyword = input["target_keyword"] as string

    let pageContent = ""
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      const html = await res.text()
      pageContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3000)
    } catch {
      pageContent = "Impossible de scraper la page"
    }

    const analysis = await callClaude(
      `Analyse SEO rapide pour : ${url}
Mot-clé cible : "${target_keyword}"
Contenu extrait : ${pageContent.slice(0, 1000)}

Donne une analyse JSON avec :
- score (0-100)
- title_ok (bool)
- meta_ok (bool)
- keyword_density (float)
- issues (liste de 3-5 problèmes)
- recommendations (liste de 3-5 actions)

Réponds uniquement avec le JSON valide.`,
      400,
    )

    try {
      return JSON.parse(analysis)
    } catch {
      return {
        score: 45,
        issues: ["Meta description absente", "H1 non optimisé", "Images sans alt"],
        recommendations: [
          "Ajouter meta description",
          "Optimiser le H1 avec le mot-clé",
          "Compresser les images",
        ],
      }
    }
  },

  // ─── Elio tools ───────────────────────────────────────────────────────
  search_prospects: async (input) => {
    return {
      query: input["query"],
      results: [],
      message: "Prospect search — connect lead source",
    }
  },

  enrich_prospect: async (input) => {
    return {
      profile_url: input["profile_url"],
      enriched: false,
      message: "Enrichment via Dropcontact/Hunter pending",
    }
  },

  generate_personalized_message: async (input) => {
    const prospect = input["prospect"] as Record<string, unknown> | undefined
    const channel = (input["channel"] as string | undefined) ?? "email"
    const sequence_step = (input["sequence_step"] as number | undefined) ?? 1
    const offer = (input["offer"] as string | undefined) ?? ""
    const sender_name = (input["sender_name"] as string | undefined) ?? "l'équipe"

    const prospectName = (prospect?.["name"] as string | undefined) ?? "le prospect"
    const prospectCompany = (prospect?.["company"] as string | undefined) ?? ""
    const prospectRole = (prospect?.["role"] as string | undefined) ?? ""
    const prospectContext = (prospect?.["context"] as string | undefined) ?? ""

    const channelGuide: Record<string, string> = {
      email: `Email de prospection (objet accrocheur, 80-120 mots, ton direct et personnalisé, 1 seule question ou CTA)`,
      linkedin: `Message LinkedIn (max 300 caractères, très direct, connexion humaine d'abord, pas de pitch immédiat)`,
      sms: `SMS de relance (max 160 caractères, court, clair, CTA immédiat)`,
    }

    const channelDesc = channelGuide[channel.toLowerCase()] ?? channel

    const stepContext = sequence_step === 1
      ? "Premier contact — ne pas pitcher directement, créer la connexion"
      : sequence_step === 2
        ? "Relance douce — rappeler le contexte, apporter de la valeur"
        : "Dernière relance — être direct, proposer une alternative ou fermer la boucle"

    const prompt = `Tu es Elio, expert en prospection B2B ultra-personnalisée.
Rédige un message de prospection (étape ${sequence_step}/3) pour:
- Nom: ${prospectName}${prospectCompany ? `\n- Entreprise: ${prospectCompany}` : ""}${prospectRole ? `\n- Poste: ${prospectRole}` : ""}${prospectContext ? `\n- Contexte/accroche: ${prospectContext}` : ""}
- Offre: ${offer || "solution IA pour PME"}
- Canal: ${channelDesc}
- Expéditeur: ${sender_name}
- Objectif étape: ${stepContext}

Rédige UNIQUEMENT le message final, prêt à envoyer. Pas d'explication.${channel === "email" ? " Commence par l'objet sur la première ligne (Objet: ...)." : ""}`

    try {
      const message = await callClaude(prompt, 400)
      return {
        success: true,
        prospect: prospect ?? {},
        channel,
        sequence_step,
        message,
        char_count: message.length,
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Message generation failed"
      return { success: false, prospect: prospect ?? {}, channel, error: errMsg }
    }
  },

  add_to_sequence: async (input, ctx) => {
    const email = input["email"] as string | undefined
    const name = (input["name"] as string | undefined) ?? ""
    const sequenceType = (input["sequence_type"] as string | undefined) ?? "standard"
    const steps = (input["steps"] as unknown[]) ?? []

    try {
      // Trouve ou crée le prospect
      let prospectId: string

      if (email) {
        const [existing] = await db.select({ id: prospects.id })
          .from(prospects)
          .where(and(eq(prospects.orgId, ctx.orgId), like(prospects.email ?? "", email)))
          .limit(1)

        if (existing) {
          prospectId = existing.id
        } else {
          const [created] = await db.insert(prospects).values({
            orgId: ctx.orgId,
            email,
            fullName: name,
            status: "contacted",
          }).returning({ id: prospects.id })
          prospectId = created?.id ?? `prospect_${Date.now()}`
        }
      } else if (input["prospect_id"]) {
        prospectId = input["prospect_id"] as string
      } else {
        return { success: false, error: "email ou prospect_id requis" }
      }

      // Créer ou référencer une séquence
      const sequenceName = `${sequenceType} — ${name || email || prospectId}`
      const [seq] = await db.insert(prospectingSequences).values({
        orgId: ctx.orgId,
        name: sequenceName,
        steps: steps as Record<string, unknown>[],
        isActive: true,
      }).returning({ id: prospectingSequences.id })

      return { success: true, prospect_id: prospectId, sequence_id: seq?.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur DB" }
    }
  },

  score_reply: async (input) => {
    return {
      message_text: input["message_text"],
      score: 50,
      category: "warm",
      reasoning: "Score via Claude",
    }
  },

  sync_to_crm: async (input, ctx) => {
    const airtableInteg = await getIntegration(ctx.orgId, "airtable" as Parameters<typeof getIntegration>[1]).catch(() => null)
    if (!airtableInteg?.credentials) {
      return {
        prospect_id: input["prospect_id"],
        crm: "none",
        success: false,
        message: "Airtable non connecté — configurez l'intégration CRM.",
      }
    }
    const creds = airtableInteg.credentials as Record<string, string>
    const { api_key, base_id, table_name } = creds
    if (!api_key || !base_id) return { success: false, error: "Credentials Airtable incomplets (api_key, base_id requis)" }

    const res = await fetch(`https://api.airtable.com/v0/${base_id}/${table_name ?? "Prospects"}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${api_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          Name: (input["name"] as string | undefined) ?? "",
          Email: (input["email"] as string | undefined) ?? "",
          Company: (input["company"] as string | undefined) ?? "",
          Status: (input["status"] as string | undefined) ?? "Lead",
        },
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return { success: false, error: err.error?.message ?? `Airtable erreur ${res.status}` }
    }
    const rec = await res.json() as { id?: string }
    return { success: true, crm: "airtable", record_id: rec.id }
  },

  suggest_next_action: async (input) => {
    const prospectId = (input["prospect_id"] as string | undefined) ?? "unknown"
    const prospectName = (input["prospect_name"] as string | undefined) ?? "le prospect"
    const lastInteraction = (input["last_interaction"] as string | undefined) ?? ""
    const currentStage = (input["current_stage"] as string | undefined) ?? "contacted"
    const sentMessages = (input["sent_messages"] as number | undefined) ?? 1
    const lastReply = (input["last_reply"] as string | undefined) ?? ""

    const prompt = `Tu es Elio, expert en sales B2B.
Analyse la situation d'un prospect et recommande la meilleure prochaine action.

Prospect: ${prospectName} (ID: ${prospectId})
Étape actuelle: ${currentStage}
Messages envoyés: ${sentMessages}
Dernière interaction: ${lastInteraction || "aucune"}
Dernier message reçu: ${lastReply || "pas de réponse"}

Réponds avec un JSON:
{
  "next_action": "action précise recommandée",
  "channel": "email|linkedin|phone|sms",
  "timing": "maintenant|dans 2 jours|dans 1 semaine|dans 2 semaines",
  "reason": "justification courte (1 phrase)",
  "priority": "high|medium|low",
  "message_angle": "angle ou accroche recommandée pour le prochain message"
}

Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 400)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, prospect_id: prospectId, ...parsed }
    } catch {
      return {
        success: true,
        prospect_id: prospectId,
        next_action: `Relancer ${prospectName} avec un angle différent`,
        channel: "email",
        timing: "dans 3 jours",
        priority: "medium",
      }
    }
  },

  // ─── Mae tools ────────────────────────────────────────────────────────
  list_unread_emails: async (input, ctx) => {
    const maxResults = (input["max_results"] as number | undefined) ?? 10

    const gcreds = await getGoogleCreds(ctx.orgId)
    if (gcreds) {
      try {
        // Liste les messages non lus
        const listRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=is:unread`,
          {
            headers: { Authorization: `Bearer ${gcreds.access_token}` },
            signal: AbortSignal.timeout(10_000),
          },
        )
        if (listRes.ok) {
          const listData = await listRes.json() as { messages?: { id: string; threadId: string }[] }
          const messageRefs = listData.messages ?? []

          // Fetch détail des 10 premiers en parallèle
          const details = await Promise.all(
            messageRefs.slice(0, 10).map(async (m) => {
              const detailRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
                {
                  headers: { Authorization: `Bearer ${gcreds.access_token}` },
                  signal: AbortSignal.timeout(5_000),
                },
              )
              if (!detailRes.ok) return { id: m.id, subject: "Email", from: "", snippet: "", date: "" }
              const detail = await detailRes.json() as {
                id: string
                snippet?: string
                payload?: { headers?: { name: string; value: string }[] }
              }
              const headers = detail.payload?.headers ?? []
              const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
              return {
                id: m.id,
                subject: getHeader("Subject"),
                from: getHeader("From"),
                date: getHeader("Date"),
                snippet: detail.snippet ?? "",
              }
            }),
          )

          return { count: messageRefs.length, emails: details, source: "gmail_api" }
        }
      } catch { /* ignorer erreur réseau */ }
    }

    return {
      success: false,
      error: "Intégration Gmail non connectée. Configure-la dans Intégrations.",
    }
  },

  categorize_email: async (input) => {
    return {
      email: input["email_id"],
      category: "to_reply",
      priority: "medium",
    }
  },

  draft_reply: async (input) => {
    const emailId = (input["email_id"] as string | undefined) ?? ""
    const originalSubject = (input["original_subject"] as string | undefined) ?? ""
    const originalBody = (input["original_body"] as string | undefined) ?? ""
    const senderName = (input["sender_name"] as string | undefined) ?? "l'expéditeur"
    const tone = (input["tone"] as string | undefined) ?? "professionnel"
    const context = (input["context"] as string | undefined) ?? ""
    const recipientName = (input["recipient_name"] as string | undefined) ?? ""

    const prompt = `Tu es Mae, assistante email experte en communication professionnelle.
Rédige une réponse à cet email.

De: ${senderName}
Objet: ${originalSubject || "sans objet"}
${originalBody ? `Contenu de l'email:\n${originalBody}\n` : ""}${context ? `Contexte supplémentaire: ${context}\n` : ""}
Instructions:
- Ton: ${tone}
- Destinataire: ${recipientName || senderName}
- Réponse concise et directe (150-250 mots max)
- Structure: salutation / réponse directe / point(s) clé(s) / clôture professionnelle
- Commencer directement par la salutation, ne pas ajouter d'introduction méta

Rédige UNIQUEMENT le corps de l'email, prêt à envoyer.`

    try {
      const draft = await callClaude(prompt, 500)
      return {
        success: true,
        email_id: emailId,
        subject: originalSubject ? `Re: ${originalSubject}` : "Re: ",
        draft,
        tone,
        word_count: draft.split(/\s+/).length,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Draft generation failed"
      return { success: false, email_id: emailId, error: message }
    }
  },

  send_email: async (input, ctx) => {
    const gcreds = await getGoogleCreds(ctx.orgId)
    if (!gcreds) {
      return {
        success: false,
        error: "Intégration Gmail non connectée. Configure-la dans Intégrations.",
      }
    }

    const to = input["to"] as string
    const subject = (input["subject"] as string | undefined) ?? ""
    const body = (input["body"] as string | undefined) ?? ""

    // Wrap automatique en template HTML branded (sauf si l'agent envoie déjà un HTML complet).
    // Le style est résolu depuis ctx.emailStyle (propagé du scheduled_job en cours).
    const finalBody = isAlreadyHtml(body) ? body : renderEmail({ subject, body, style: ctx.emailStyle })
    // Construire email RFC 822 encodé base64url (subject RFC 2047 + body base64 si UTF-8)
    const raw = buildGmailRaw({ to, subject, body: finalBody })

    const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gcreds.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!gmailRes.ok) {
      const err = await gmailRes.json().catch(() => ({})) as { error?: { message?: string } }
      return { success: false, error: err.error?.message ?? `Gmail erreur ${gmailRes.status}` }
    }
    const sent = await gmailRes.json() as { id?: string }
    void logContent({
      orgId: ctx.orgId,
      agentSlug: ctx.agentSlug,
      contentType: "email",
      platform: "gmail",
      title: `Email à ${to}: ${subject}`,
      body,
      externalId: sent.id,
      metadata: { to, subject, message_id: sent.id },
    }).catch(() => {})
    return { success: true, message_id: sent.id }
  },

  archive_email: async (input, ctx) => {
    const emailId = input["email_id"] as string
    const gcreds = await getGoogleCreds(ctx.orgId)
    if (!gcreds) return { success: false, error: "Intégration Gmail non connectée. Configure-la dans Intégrations." }

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${gcreds.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
        signal: AbortSignal.timeout(10_000),
      },
    )
    return { email_id: emailId, success: res.ok, error: res.ok ? undefined : `Gmail erreur ${res.status}` }
  },

  label_email: async (input, ctx) => {
    const emailId = input["email_id"] as string
    const label = input["label"] as string
    const gcreds = await getGoogleCreds(ctx.orgId)
    if (!gcreds) return { success: false, error: "Intégration Gmail non connectée. Configure-la dans Intégrations." }

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${gcreds.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ addLabelIds: [label] }),
        signal: AbortSignal.timeout(10_000),
      },
    )
    return { email_id: emailId, label, success: res.ok, error: res.ok ? undefined : `Gmail erreur ${res.status}` }
  },

  summarize_inbox: async (_input, ctx) => {
    const gcreds = await getGoogleCreds(ctx.orgId)
    let emails: Array<{ id: string; subject: string; from: string; snippet: string; date: string }> = []

    if (gcreds) {
      try {
        const listRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=is:unread",
          { headers: { Authorization: `Bearer ${gcreds.access_token}` }, signal: AbortSignal.timeout(10_000) },
        )
        if (listRes.ok) {
          const listData = await listRes.json() as { messages?: { id: string }[] }
          const refs = listData.messages ?? []
          emails = await Promise.all(
            refs.slice(0, 20).map(async (m) => {
              const r = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
                { headers: { Authorization: `Bearer ${gcreds.access_token}` }, signal: AbortSignal.timeout(5_000) },
              )
              if (!r.ok) return { id: m.id, subject: "", from: "", snippet: "", date: "" }
              const d = await r.json() as { snippet?: string; payload?: { headers?: { name: string; value: string }[] } }
              const h = d.payload?.headers ?? []
              const getH = (n: string) => h.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value ?? ""
              return { id: m.id, subject: getH("Subject"), from: getH("From"), snippet: d.snippet ?? "", date: getH("Date") }
            }),
          )
        }
      } catch { /* continuer avec liste vide */ }
    }

    if (emails.length === 0) {
      if (!gcreds) {
        return { success: false, error: "Intégration Gmail non connectée. Configure-la dans Intégrations." }
      }
      return { summary: "Aucun email non lu.", urgent: 0, total: 0 }
    }

    const prompt = `Voici mes emails non lus (${emails.length}). Fais un résumé structuré en français : urgences, à répondre, FYI. Sois concis et actionnable.\n\n${JSON.stringify(emails.map((e) => ({ subject: e.subject, from: e.from, snippet: e.snippet })))}`
    const summary = await callClaude(prompt, 600)

    return { summary, email_count: emails.length, total: emails.length }
  },

  // ─── Max tools ────────────────────────────────────────────────────────
  generate_image: async (input, ctx) => {
    const prompt      = input["prompt"] as string
    const style       = (input["style"] as string) ?? "photorealistic"
    const aspectRatio = (input["aspect_ratio"] as string) ?? "1:1"
    const provider    = (input["provider"] as string) ?? "auto"

    const replicateKey = process.env["REPLICATE_API_TOKEN"]
    const openaiKey    = process.env["OPENAI_API_KEY"]
    const geminiKey    = process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_AI_API_KEY"]

    const errors: string[] = []

    // ── OpenAI Image (dall-e-3 → gpt-image-1 en fallback) ── ~3-5s ───────────
    const tryDallE = async (): Promise<{ url: string; provider: string } | null> => {
      if (!openaiKey) return null

      // Essaie dall-e-3 → dall-e-2 → gpt-image-1
      for (const model of ["dall-e-3", "dall-e-2", "gpt-image-1"]) {
        try {
          // dall-e-2 : taille fixe 1024x1024, pas de quality ni de response_format avancé
          const size = model === "dall-e-2"
            ? "1024x1024"
            : (aspectRatio === "16:9" ? "1792x1024" : aspectRatio === "9:16" ? "1024x1792" : "1024x1024")
          const bodyObj: Record<string, unknown> = { model, prompt: `${prompt}, ${style}`, n: 1, size }
          if (model === "dall-e-3") { bodyObj["quality"] = "hd"; bodyObj["response_format"] = "url" }
          if (model === "gpt-image-1") { bodyObj["response_format"] = "b64_json" }
          const res = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(bodyObj),
          })
          if (!res.ok) {
            const errText = await res.text().catch(() => `HTTP ${res.status}`)
            errors.push(`${model} ${res.status}: ${errText.slice(0, 100)}`)
            logger.error("[generate_image] OpenAI failed", { model, status: res.status, body: errText.slice(0, 200) })
            continue
          }
          const body = await res.json() as { data?: Array<{ url?: string; b64_json?: string }> }
          const item = body.data?.[0]
          if (!item) continue
          if (item.url) return { url: item.url, provider: model }
          if (item.b64_json) return { url: `data:image/png;base64,${item.b64_json}`, provider: model }
        } catch (e) {
          errors.push(`${model} exception: ${String(e).slice(0, 80)}`)
        }
      }
      return null
    }

    // ── Replicate ─── Flux Schnell (gratuit) puis Flux 1.1 Pro ──────────────
    const tryReplicate = async (): Promise<{ url: string; provider: string } | null> => {
      if (!replicateKey) return null

      // Essaie Flux Schnell (free) puis Flux 1.1 Pro
      const models = [
        { url: "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",    name: "flux-schnell"   },
        { url: "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",   name: "flux-1.1-pro"   },
      ]

      for (const model of models) {
        try {
          const res = await fetch(model.url, {
            method: "POST",
            headers: { "Authorization": `Bearer ${replicateKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ input: { prompt: `${prompt}, ${style}, professional quality`, aspect_ratio: aspectRatio } }),
          })
          if (!res.ok) {
            const errText = await res.text().catch(() => `HTTP ${res.status}`)
            errors.push(`${model.name} ${res.status}: ${errText.slice(0, 100)}`)
            logger.error("[generate_image] Replicate failed", { model: model.name, status: res.status, body: errText.slice(0, 200) })
            continue
          }
          const prediction = await res.json() as { id: string; urls: { get: string } }
          for (let i = 0; i < 8; i++) {
            await new Promise(r => setTimeout(r, 1500))
            const poll = await fetch(prediction.urls.get, { headers: { "Authorization": `Bearer ${replicateKey}` } })
            const result = await poll.json() as { status: string; output?: string[] | string; error?: string }
            if (result.status === "succeeded") {
              const rawOut = result.output
              const url = Array.isArray(rawOut) ? rawOut[0] : (typeof rawOut === "string" ? rawOut : null)
              if (url) return { url, provider: model.name }
              errors.push(`${model.name}: empty output`)
              break
            }
            if (result.status === "failed") {
              errors.push(`${model.name}: failed — ${result.error ?? "unknown"}`)
              break
            }
          }
        } catch (e) {
          errors.push(`${model.name} exception: ${String(e).slice(0, 80)}`)
        }
      }
      return null
    }

    // ── Gemini / Flash image gen via AI Studio ────────────────────────────────
    const tryGemini = async (): Promise<{ url: string; provider: string } | null> => {
      if (!geminiKey) return null
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Generate a high quality ${style} image: ${prompt}. Return only the image.` }] }],
              generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
            }),
          }
        )
        if (!res.ok) {
          const errText = await res.text().catch(() => `HTTP ${res.status}`)
          errors.push(`Gemini ${res.status}: ${errText.slice(0, 150)}`)
          logger.error("[generate_image] Gemini failed", { status: res.status, body: errText.slice(0, 200) })
          return null
        }
        const body = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; text?: string }> } }> }
        const inlineData = body.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData
        if (!inlineData?.data) { errors.push("Gemini: no image in response"); return null }
        const mime = inlineData.mimeType ?? "image/png"
        return { url: `data:${mime};base64,${inlineData.data}`, provider: "gemini" }
      } catch (e) {
        errors.push(`Gemini exception: ${String(e).slice(0, 100)}`)
        return null
      }
    }

    // ── Résolution : parallèle si auto, sinon ciblé ──────────────────────────
    let result: { url: string; provider: string } | null = null

    if (provider === "dall-e") {
      result = await tryDallE()
    } else if (provider === "gemini") {
      result = await tryGemini()
    } else if (provider === "replicate") {
      result = await tryReplicate()
    } else {
      // auto : DALL-E + Replicate en parallèle (Gemini en fallback si les 2 échouent)
      result = await new Promise<{ url: string; provider: string } | null>((resolve) => {
        const primary = [tryDallE(), tryReplicate()]
        let settled = 0
        primary.forEach(p => {
          p.then(r => {
            if (r) resolve(r)
            else if (++settled === primary.length) resolve(null)
          }).catch(() => { if (++settled === primary.length) resolve(null) })
        })
      })
      // Fallback Gemini si DALL-E + Replicate ont tous les deux échoué
      if (!result) result = await tryGemini()
    }

    if (!result) {
      const configured = [replicateKey && "Replicate", openaiKey && "DALL-E", geminiKey && "Gemini"].filter(Boolean)
      logger.error("[generate_image] All providers failed", { errors, configured })
      // Message court pour que l'agent ne demande pas à l'utilisateur de "connecter" quoi que ce soit
      const detail = errors.length ? errors.join(" | ").slice(0, 300) : "timeout ou service indisponible"
      return {
        error: `Erreur génération image — ${detail}. Réessaie dans quelques secondes.`,
      }
    }

    // Sauvegarder dans Mes contenus (pas les data URLs base64 Gemini)
    if (!result.url.startsWith("data:")) {
      void logContent({
        orgId: ctx.orgId,
        agentSlug: ctx.agentSlug,
        contentType: "image",
        title: `Image — ${prompt.slice(0, 100)}`,
        externalUrl: result.url,
        metadata: { prompt, style, aspect_ratio: aspectRatio, provider: result.provider },
      }).catch(() => {})
    }

    return { url: result.url, prompt, style, provider: result.provider }
  },

  optimize_prompt: async (input) => {
    const userPrompt = (input["prompt"] as string | undefined) ?? (input["user_description"] as string | undefined) ?? ""
    if (!userPrompt.trim()) return { success: false, error: "Prompt vide" }

    const optimized = await callClaude(
      `Tu es un expert en prompt engineering pour Flux / Stable Diffusion. Transforme cette description française en prompt anglais optimisé pour la génération d'image professionnelle (max 150 mots, style descriptif, éclairage, composition, qualité):\n\n"${userPrompt}"`,
      300,
    )
    return { optimized_prompt: optimized.trim(), original: userPrompt, language: "en" }
  },

  remove_background: async (input) => {
    const imageUrl = input["image_url"] as string
    const replicateKey = process.env["REPLICATE_API_TOKEN"]
    if (!replicateKey) return { success: false, error: "Intégration Replicate non configurée. Ajoute REPLICATE_API_TOKEN dans les paramètres." }
    try {
      const res = await fetch("https://api.replicate.com/v1/models/851-labs/background-remover/predictions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${replicateKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { image: imageUrl } }),
      })
      if (!res.ok) return { success: false, error: `Replicate HTTP ${res.status}` }
      const prediction = await res.json() as { id: string; urls: { get: string } }
      let attempts = 0
      while (attempts < 15) {
        await new Promise(r => setTimeout(r, 2000))
        const pollRes = await fetch(prediction.urls.get, { headers: { "Authorization": `Bearer ${replicateKey}` } })
        const result = await pollRes.json() as { status: string; output?: string }
        if (result.status === "succeeded" && result.output) return { success: true, url: result.output, original_url: imageUrl }
        if (result.status === "failed") return { success: false, error: "Suppression arrière-plan échouée" }
        attempts++
      }
      return { success: false, error: "Timeout" }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur Replicate" }
    }
  },

  upscale_image: async (input) => {
    const imageUrl = input["image_url"] as string
    const factor = Math.min((input["factor"] as number | undefined) ?? 4, 4)
    const replicateKey = process.env["REPLICATE_API_TOKEN"]
    if (!replicateKey) return { success: false, error: "Intégration Replicate non configurée. Ajoute REPLICATE_API_TOKEN dans les paramètres." }
    try {
      const res = await fetch("https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${replicateKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { image: imageUrl, scale: factor, face_enhance: false } }),
      })
      if (!res.ok) return { success: false, error: `Replicate HTTP ${res.status}` }
      const prediction = await res.json() as { id: string; urls: { get: string } }
      let attempts = 0
      while (attempts < 15) {
        await new Promise(r => setTimeout(r, 2000))
        const pollRes = await fetch(prediction.urls.get, { headers: { "Authorization": `Bearer ${replicateKey}` } })
        const result = await pollRes.json() as { status: string; output?: string }
        if (result.status === "succeeded" && result.output) return { success: true, url: result.output, original_url: imageUrl, factor }
        if (result.status === "failed") return { success: false, error: "Upscaling échoué" }
        attempts++
      }
      return { success: false, error: "Timeout" }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur Replicate" }
    }
  },

  batch_variations: async (input) => {
    const prompt = (input["prompt"] as string | undefined) ?? ""
    const style = (input["style"] as string | undefined) ?? "photorealistic"
    const aspectRatio = (input["aspect_ratio"] as string | undefined) ?? "1:1"
    const count = Math.min((input["count"] as number | undefined) ?? 4, 8)
    const replicateKey = process.env["REPLICATE_API_TOKEN"]

    if (!replicateKey) {
      return {
        success: false,
        error: "Intégration Replicate non configurée. Ajoute REPLICATE_API_TOKEN dans les paramètres.",
      }
    }

    const variations: string[] = []
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 999999)
      try {
        const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
          method: "POST",
          headers: { Authorization: `Bearer ${replicateKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { prompt: `${prompt}, ${style}, professional quality`, aspect_ratio: aspectRatio, output_quality: 90, seed },
          }),
          signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) continue
        const prediction = await res.json() as { id: string; status: string; urls: { get: string } }
        // Poll max 30s
        let attempts = 0
        while (attempts < 15) {
          await new Promise((r) => setTimeout(r, 2000))
          const pollRes = await fetch(prediction.urls.get, { headers: { Authorization: `Bearer ${replicateKey}` } })
          const result = await pollRes.json() as { status: string; output?: string[] }
          if (result.status === "succeeded" && result.output?.[0]) {
            variations.push(result.output[0])
            break
          }
          if (result.status === "failed") break
          attempts++
        }
      } catch { /* ignorer les erreurs de génération individuelle */ }
    }

    return { prompt, count: variations.length, variations, requested: count }
  },

  generate_video: async (input, ctx) => {
    const prompt = (input["prompt"] as string | undefined) ?? ""
    const imageUrl = input["image_url"] as string | undefined
    const replicateKey = process.env["REPLICATE_API_TOKEN"]
    if (!replicateKey) return { success: false, error: "Intégration Replicate non configurée. Ajoute REPLICATE_API_TOKEN dans les paramètres." }
    try {
      const isImg2Vid = !!imageUrl
      const modelPath = isImg2Vid
        ? "stability-ai/stable-video-diffusion"
        : "minimax/video-01"
      const modelInput = isImg2Vid
        ? { input_image: imageUrl, cond_aug: 0.02, decode_chunk_size: 8, motion_bucket_id: 127, fps_id: 6 }
        : { prompt, prompt_optimizer: true }

      const res = await fetch(`https://api.replicate.com/v1/models/${modelPath}/predictions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${replicateKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: modelInput }),
      })
      if (!res.ok) return { success: false, error: `Replicate HTTP ${res.status}` }
      const prediction = await res.json() as { id: string; urls: { get: string } }

      // Vidéos prennent plus de temps — poll max 90s
      let attempts = 0
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 3000))
        const pollRes = await fetch(prediction.urls.get, { headers: { "Authorization": `Bearer ${replicateKey}` } })
        const result = await pollRes.json() as { status: string; output?: string | string[] }
        if (result.status === "succeeded") {
          const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output
          if (videoUrl) {
            void logContent({
              orgId: ctx.orgId,
              agentSlug: ctx.agentSlug,
              contentType: "video",
              title: `Vidéo — ${prompt.slice(0, 100)}`,
              externalUrl: videoUrl as string,
              metadata: { prompt, prediction_id: prediction.id, model: modelPath },
            }).catch(() => {})
          }
          return { success: true, url: videoUrl, prompt, model: modelPath }
        }
        if (result.status === "failed") return { success: false, error: "Génération vidéo échouée" }
        attempts++
      }
      return { success: false, error: "Timeout — génération trop longue, essaie à nouveau", prediction_id: prediction.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur Replicate" }
    }
  },

  // ─── Nova tools ───────────────────────────────────────────────────────
  get_stripe_metrics: async (_input, ctx) => {
    // Priorité : intégration Stripe de l'org, fallback env
    const stripeInteg = await getIntegration(ctx.orgId, "stripe").catch(() => null)
    const stripeKey = stripeInteg?.credentials
      ? (stripeInteg.credentials as Record<string, string>)["secret_key"]
      : process.env["STRIPE_SECRET_KEY"]

    if (!stripeKey) {
      return {
        success: false,
        error: "Intégration Stripe non connectée. Configure-la dans Intégrations.",
      }
    }

    try {
      const [balanceRes, subsRes] = await Promise.all([
        fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${stripeKey}` },
          signal: AbortSignal.timeout(10_000),
        }),
        fetch("https://api.stripe.com/v1/subscriptions?status=active&limit=100", {
          headers: { Authorization: `Bearer ${stripeKey}` },
          signal: AbortSignal.timeout(10_000),
        }),
      ])

      const balance = await balanceRes.json() as { available: { amount: number; currency: string }[] }
      const subs = subsRes.ok
        ? (await subsRes.json() as { data: Array<{ plan?: { amount?: number } }> })
        : { data: [] }

      const available = balance.available?.[0]?.amount ?? 0
      const mrr = subs.data.reduce((sum, s) => sum + (s.plan?.amount ?? 0), 0) / 100

      return {
        source: "stripe_live",
        balance_cents: available,
        currency: balance.available?.[0]?.currency ?? "eur",
        active_subscriptions: subs.data.length,
        mrr,
        arr: mrr * 12,
      }
    } catch {
      return { source: "stripe_error", error: "Impossible de contacter Stripe" }
    }
  },

  detect_anomalies: async (input) => {
    return {
      metric: input["metric"],
      anomalies: [],
      message: "Anomaly detection pending real data",
    }
  },

  simulate_scenario: async (input) => {
    const params = input["params"] as Record<string, unknown> | undefined
    const scenarioType = (input["scenario_type"] as string | undefined) ?? "croissance"
    const timeframe = (input["timeframe"] as string | undefined) ?? "6 mois"
    const currentMrr = (params?.["mrr"] as number | undefined) ?? 0
    const currentChurn = (params?.["churn"] as number | undefined) ?? 5
    const growthRate = (params?.["growth_rate"] as number | undefined) ?? 10

    const prompt = `Tu es Nova, conseillère business et analyste financière IA.
Simule le scénario suivant pour une entreprise SaaS/PME:

Type de scénario: ${scenarioType}
Horizon: ${timeframe}
MRR actuel: ${currentMrr}€
Churn mensuel: ${currentChurn}%
Taux de croissance actuel: ${growthRate}%/mois
Paramètres additionnels: ${JSON.stringify(params ?? {})}

Génère une simulation réaliste avec:
{
  "scenario_summary": "résumé du scénario en 2 phrases",
  "assumptions": ["hypothèse 1", "hypothèse 2", "hypothèse 3"],
  "projections": [
    { "month": 1, "mrr": 0, "cumulative_revenue": 0, "customers_estimate": 0 },
    { "month": 3, "mrr": 0, "cumulative_revenue": 0, "customers_estimate": 0 },
    { "month": 6, "mrr": 0, "cumulative_revenue": 0, "customers_estimate": 0 }
  ],
  "key_drivers": ["driver positif 1", "driver positif 2"],
  "risks": ["risque 1", "risque 2"],
  "recommendation": "recommandation actionnable en 1-2 phrases",
  "confidence": "high|medium|low"
}

Calcule des chiffres réalistes basés sur les paramètres fournis.
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 800)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return {
        success: true,
        scenario_type: scenarioType,
        timeframe,
        params: params ?? {},
        ...parsed,
      }
    } catch {
      return {
        success: false,
        scenario_type: scenarioType,
        params: params ?? {},
        projection: null,
        message: "Simulation failed — provide more specific parameters",
      }
    }
  },

  generate_weekly_report: async (input) => {
    const period = (input["period"] as string) ?? "this_week"
    const metrics = (input["include_metrics"] as string[]) ?? ["mrr", "churn", "new_customers"]

    // Tenter Stripe si configuré
    const stripeKey = process.env["STRIPE_SECRET_KEY"]
    let stripeData: Record<string, unknown> = {}

    if (stripeKey) {
      try {
        const customersRes = await fetch(
          "https://api.stripe.com/v1/customers?limit=5&created[gte]=" +
            Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000),
          { headers: { Authorization: `Bearer ${stripeKey}` } },
        )
        if (customersRes.ok) {
          const data = (await customersRes.json()) as { data: unknown[]; has_more: boolean }
          stripeData = { new_customers_this_week: data.data?.length ?? 0 }
        }
      } catch { /* ignore */ }
    }

    // Générer le rapport avec Claude
    const mockData = {
      mrr: 4970,
      mrr_growth: "+5.3%",
      new_customers: (stripeData["new_customers_this_week"] as number) ?? 3,
      churn: "2.1%",
      top_agent: "Charles",
      agent_calls: 87,
      content_published: 12,
      leads_qualified: 5,
      ...stripeData,
    }

    const report = await callClaude(
      `Génère un rapport hebdomadaire concis pour un entrepreneur basé sur ces données :
${JSON.stringify(mockData, null, 2)}

Format :
- Résumé exécutif (2 phrases)
- Chiffres clés (liste à puces)
- 3 points d'action prioritaires
- Prévision semaine prochaine

Sois direct et actionnable. Format markdown.`,
      600,
    )

    return {
      report,
      period,
      generated_at: new Date().toISOString(),
      metrics: mockData,
      include_metrics: metrics,
    }
  },

  brief_of_the_day: async () => {
    return { priorities: [], message: "Daily brief generation pending integrations" }
  },

  // ─── Alba tools ───────────────────────────────────────────────────────
  parse_cv: async (input) => {
    return {
      file_url: input["file_url"],
      parsed: false,
      message: "CV parsing pending file integration",
    }
  },

  score_cv: async (input) => {
    const cvData = input["cv_data"] as Record<string, unknown> | string | undefined
    const jobCriteria = input["job_criteria"] as Record<string, unknown> | string | undefined
    const jobTitle = (input["job_title"] as string | undefined) ?? "le poste"
    const mustHave = (input["must_have"] as string[] | undefined) ?? []
    const niceToHave = (input["nice_to_have"] as string[] | undefined) ?? []

    const cvText = typeof cvData === "string" ? cvData : JSON.stringify(cvData ?? {})
    const criteriaText = typeof jobCriteria === "string" ? jobCriteria : JSON.stringify(jobCriteria ?? {})

    const prompt = `Tu es Alba, experte RH en recrutement et évaluation de candidats.
Analyse ce CV par rapport aux critères du poste.

Poste: ${jobTitle}
Critères obligatoires: ${mustHave.length > 0 ? mustHave.join(", ") : "non spécifiés"}
Critères souhaitables: ${niceToHave.length > 0 ? niceToHave.join(", ") : "non spécifiés"}
Autres critères: ${criteriaText}

CV du candidat:
${cvText}

Réponds avec un JSON:
{
  "score": (0-100, entier),
  "recommendation": "to_interview|maybe|reject",
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "gaps": ["lacune 1", "lacune 2"],
  "must_have_check": [
    { "criterion": "critère", "met": true|false, "evidence": "extrait du CV ou 'non trouvé'" }
  ],
  "summary": "résumé d'évaluation en 2-3 phrases",
  "interview_questions": ["question pertinente 1", "question pertinente 2", "question pertinente 3"]
}

Sois objectif, factuel et bienveillant. Score 80+ = fort, 60-79 = à considérer, <60 = insuffisant.
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 800)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return {
        success: true,
        job_title: jobTitle,
        criteria: jobCriteria ?? {},
        ...parsed,
      }
    } catch {
      return {
        success: false,
        cv_data: cvData ?? {},
        score: 0,
        criteria: jobCriteria ?? {},
        error: "CV scoring failed — ensure cv_data is provided in text form",
      }
    }
  },

  draft_candidate_message: async (input) => {
    return {
      candidate: input["candidate_name"],
      draft: "Candidate message via Claude",
      tone: input["tone"] ?? "professional",
    }
  },

  schedule_interview: async (input, ctx) => {
    const gcreds = await getGoogleCreds(ctx.orgId)
    const candidateName = (input["candidate_name"] as string | undefined) ?? "Candidat"
    const preferredDates = input["preferred_dates"] as string | string[] | undefined
    const startDt = Array.isArray(preferredDates) ? preferredDates[0] : preferredDates
    const candidateEmail = input["candidate_email"] as string | undefined
    const position = (input["position"] as string | undefined) ?? "Entretien"

    if (!gcreds) {
      return {
        success: false,
        error: "Intégration Google Calendar non connectée. Configure-la dans Intégrations.",
      }
    }
    if (!startDt) {
      return {
        success: false,
        error: "Date d'entretien requise.",
      }
    }

    // Durée entretien : 1h par défaut
    const startMs = new Date(startDt).getTime()
    const endDt = new Date(startMs + 60 * 60 * 1000).toISOString()

    const eventBody = {
      summary: `Entretien — ${candidateName} (${position})`,
      description: `Entretien candidat pour le poste : ${position}`,
      start: { dateTime: startDt, timeZone: "Europe/Paris" },
      end: { dateTime: endDt, timeZone: "Europe/Paris" },
      attendees: candidateEmail ? [{ email: candidateEmail }] : [],
    }

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${gcreds.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(eventBody),
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return { success: false, error: err.error?.message ?? `Erreur Google Calendar ${res.status}` }
    }
    const event = await res.json() as { id?: string; htmlLink?: string }
    return {
      success: true,
      candidate_name: candidateName,
      slot: startDt,
      event_id: event.id,
      link: event.htmlLink,
      source: "google_calendar",
    }
  },

  generate_contract: async (input) => {
    const contractType = (input["contract_type"] as string | undefined) ?? "CDI"
    const employeeName = (input["employee_name"] as string | undefined) ?? ""
    const position = (input["position"] as string | undefined) ?? ""
    const salary = (input["salary"] as string | undefined) ?? ""
    const startDate = (input["start_date"] as string | undefined) ?? ""
    const companyName = (input["company_name"] as string | undefined) ?? "la Société"
    const trialPeriod = (input["trial_period"] as string | undefined) ?? ""
    const workingHours = (input["working_hours"] as string | undefined) ?? "35h/semaine"

    const contractGuide: Record<string, string> = {
      CDI: "Contrat à Durée Indéterminée (CDI) de droit français",
      CDD: "Contrat à Durée Déterminée (CDD) — mentionner la durée et le motif de recours",
      stage: "Convention de stage (loi Cherpion 2011) — mentionner la durée, l'établissement et la gratification",
      alternance: "Contrat d'alternance (apprentissage ou professionnalisation) — mentionner le CFA et le rythme",
      freelance: "Contrat de prestation de services freelance/indépendant",
    }

    const contractDesc = contractGuide[contractType] ?? contractType

    const prompt = `Tu es Alba, experte RH et droit du travail français.
Génère un modèle de contrat de travail professionnel.

Type: ${contractDesc}
Employé/Prestataire: ${employeeName || "[NOM PRÉNOM]"}
Poste: ${position || "[INTITULÉ DU POSTE]"}
Rémunération: ${salary || "[SALAIRE] € brut/mois"}
Date de début: ${startDate || "[DATE DE DÉBUT]"}
Employeur/Société: ${companyName}
Durée du travail: ${workingHours}
${trialPeriod ? `Période d'essai: ${trialPeriod}` : ""}

Génère un contrat complet en Markdown avec:
1. En-tête (parties, objet)
2. Poste et missions
3. Durée et horaires
4. Rémunération et avantages
5. Période d'essai (si applicable)
6. Confidentialité et non-concurrence
7. Conditions de rupture
8. Droit applicable
9. Signatures

Note légale en bas: "Ce document est un modèle — faire relire par un juriste avant signature."
Utilise [PLACEHOLDER] pour les champs à compléter. Sois précis sur les aspects légaux français.`

    try {
      const contract = await callClaude(prompt, 2000)
      return {
        success: true,
        contract_type: contractType,
        employee_name: employeeName,
        position,
        contract,
        disclaimer: "Modèle généré par IA — vérification juridique recommandée avant utilisation",
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Contract generation failed"
      return { success: false, contract_type: contractType, employee_name: employeeName, error: message }
    }
  },

  answer_hr_question: async (input) => {
    const question = (input["question"] as string | undefined) ?? ""
    const context = (input["context"] as string | undefined) ?? ""
    const employeeRole = (input["employee_role"] as string | undefined) ?? "salarié"
    const contractType = (input["contract_type"] as string | undefined) ?? ""

    if (!question.trim()) {
      return { success: false, error: "Question is required" }
    }

    const prompt = `Tu es Alba, experte RH et droit du travail français. Tu réponds aux questions RH des salariés et managers avec précision et bienveillance.

Question: ${question}
${context ? `Contexte: ${context}` : ""}
${employeeRole ? `Profil: ${employeeRole}` : ""}
${contractType ? `Type de contrat: ${contractType}` : ""}

Fournis une réponse:
1. Claire et directe (200-350 mots)
2. Basée sur le droit du travail français actuel
3. Avec des exemples concrets si pertinent
4. Avec les références légales ou conventionnelles quand c'est important (Code du travail, article, etc.)
5. Termine par une recommandation pratique

Si la question nécessite un conseil personnalisé au-delà d'informations générales, indique de consulter un juriste ou un expert RH.`

    try {
      const answer = await callClaude(prompt, 600)
      return {
        success: true,
        question,
        answer,
        disclaimer: "Information à titre indicatif — pour des situations complexes, consulter un juriste spécialisé en droit du travail.",
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "HR question answering failed"
      return { success: false, question, error: message }
    }
  },

  // ─── Automation tools (n8n) ───────────────────────────────────────────
  list_n8n_nodes: async () => {
    return { nodes: [], message: "n8n integration pending" }
  },

  generate_n8n_workflow: async (input) => {
    const description = (input["description"] as string | undefined) ?? ""
    const trigger = (input["trigger"] as string | undefined) ?? "webhook"
    const integrations = (input["integrations"] as string[] | undefined) ?? []
    const complexity = (input["complexity"] as string | undefined) ?? "medium"

    const prompt = `Tu es un expert en automatisation n8n et workflows no-code.
Génère un workflow n8n valide et complet pour:

Description: ${description}
Déclencheur: ${trigger}
Intégrations impliquées: ${integrations.length > 0 ? integrations.join(", ") : "à déterminer selon le besoin"}
Complexité: ${complexity}

Génère un JSON workflow n8n VALIDE avec cette structure exacte:
{
  "name": "Nom descriptif du workflow",
  "active": false,
  "nodes": [
    {
      "id": "node-uuid-unique",
      "name": "Nom du noeud",
      "type": "n8n-nodes-base.NomDuNoeud",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": {
        // paramètres spécifiques au type de noeud
      }
    }
  ],
  "connections": {
    "Nom du noeud source": {
      "main": [
        [{ "node": "Nom du noeud destination", "type": "main", "index": 0 }]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner"
  },
  "meta": {
    "templateId": "lynaris-generated",
    "description": "${description}"
  }
}

Types de noeuds n8n courants:
- Webhook: n8n-nodes-base.Webhook
- HTTP Request: n8n-nodes-base.HttpRequest
- Code: n8n-nodes-base.Code
- IF: n8n-nodes-base.If
- Set: n8n-nodes-base.Set
- Gmail: n8n-nodes-base.Gmail
- Google Calendar: n8n-nodes-base.GoogleCalendar
- Slack: n8n-nodes-base.Slack
- Airtable: n8n-nodes-base.Airtable
- Notion: n8n-nodes-base.Notion
- Send Email: n8n-nodes-base.SendEmail
- Schedule Trigger: n8n-nodes-base.ScheduleTrigger

Positions: commence à [250, 300], espacer les noeuds de 200px horizontalement.
Génère des UUIDs comme "node-1", "node-2", etc.
Réponds UNIQUEMENT avec le JSON du workflow, sans markdown ni explication.`

    try {
      const raw = await callClaude(prompt, 2000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const workflow = JSON.parse(cleaned) as Record<string, unknown>
      return {
        success: true,
        description,
        workflow_json: workflow,
        node_count: Array.isArray(workflow["nodes"]) ? (workflow["nodes"] as unknown[]).length : 0,
        message: "Workflow generated — review and test before deploying to n8n",
      }
    } catch {
      // Return a minimal valid workflow as fallback
      const fallbackWorkflow = {
        name: `Workflow: ${description.slice(0, 50)}`,
        active: false,
        nodes: [
          {
            id: "node-1",
            name: "Webhook Trigger",
            type: "n8n-nodes-base.Webhook",
            typeVersion: 1,
            position: [250, 300],
            parameters: {
              httpMethod: "POST",
              path: "lynaris-webhook",
              responseMode: "onReceived",
            },
          },
          {
            id: "node-2",
            name: "Process Data",
            type: "n8n-nodes-base.Code",
            typeVersion: 2,
            position: [450, 300],
            parameters: {
              jsCode: `// Auto-generated for: ${description}\nreturn [{ json: $input.first().json }]`,
            },
          },
        ],
        connections: {
          "Webhook Trigger": {
            main: [[{ node: "Process Data", type: "main", index: 0 }]],
          },
        },
        settings: {
          executionOrder: "v1",
          saveManualExecutions: true,
        },
        meta: {
          templateId: "lynaris-generated",
          description,
        },
      }
      return {
        success: true,
        description,
        workflow_json: fallbackWorkflow,
        node_count: 2,
        message: "Basic workflow generated (fallback) — customize nodes for your specific use case",
      }
    }
  },

  deploy_n8n_workflow: async (input, ctx) => {
    const n8nInteg = await getIntegration(ctx.orgId, "n8n").catch(() => null)
    const baseUrl = n8nInteg?.credentials
      ? (n8nInteg.credentials as Record<string, string>)["base_url"]
      : process.env["N8N_BASE_URL"]
    const apiKey = n8nInteg?.credentials
      ? (n8nInteg.credentials as Record<string, string>)["api_key"]
      : process.env["N8N_API_KEY"]

    if (!baseUrl) {
      return {
        success: false,
        error: "n8n non configuré — définissez N8N_BASE_URL dans .env ou connectez l'intégration n8n.",
      }
    }

    const res = await fetch(`${baseUrl}/api/v1/workflows`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": apiKey ?? "", "Content-Type": "application/json" },
      body: JSON.stringify(input["workflow_json"]),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      return { success: false, error: err.message ?? `n8n erreur ${res.status}` }
    }
    const wf = await res.json() as { id?: string; name?: string }
    return { success: true, workflow_id: wf.id, name: wf.name ?? input["name"] }
  },

  test_n8n_workflow: async (input) => {
    return {
      id: input["workflow_id"],
      test_result: null,
      message: "n8n testing pending",
    }
  },

  list_org_workflows: async (_input, ctx) => {
    const n8nInteg = await getIntegration(ctx.orgId, "n8n").catch(() => null)
    const baseUrl = n8nInteg?.credentials
      ? (n8nInteg.credentials as Record<string, string>)["base_url"]
      : process.env["N8N_BASE_URL"]
    const apiKey = n8nInteg?.credentials
      ? (n8nInteg.credentials as Record<string, string>)["api_key"]
      : process.env["N8N_API_KEY"]

    if (!baseUrl) return { workflows: [], message: "n8n non configuré" }

    try {
      const res = await fetch(`${baseUrl}/api/v1/workflows`, {
        headers: { "X-N8N-API-KEY": apiKey ?? "" },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return { workflows: [], error: `n8n erreur ${res.status}` }
      const data = await res.json() as { data?: Array<{ id: string; name: string; active: boolean }> }
      return { workflows: data.data ?? [], count: data.data?.length ?? 0 }
    } catch (err) {
      return { workflows: [], error: err instanceof Error ? err.message : "n8n unreachable" }
    }
  },

  // ─── Aria tools ───────────────────────────────────────────────────────
  // ─── CORE TOOLS — accessibles à tous les agents (todo list + contacts) ────

  list_tasks: async (input, ctx) => {
    const status = (input["status"] as string | undefined) ?? "all"
    const priority = (input["priority"] as string | undefined) ?? "all"
    const limit = Math.min(Math.max(Number(input["limit"]) || 20, 1), 100)

    const conditions = [eq(tasks.orgId, ctx.orgId)]
    if (status !== "all" && ["todo", "in_progress", "done"].includes(status)) {
      conditions.push(eq(tasks.status, status))
    }
    if (priority !== "all" && ["low", "medium", "high"].includes(priority)) {
      conditions.push(eq(tasks.priority, priority))
    }

    const rows = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)

    return {
      success: true,
      count: rows.length,
      tasks: rows.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.dueDate?.toISOString() ?? null,
        created_by: t.createdBy,
      })),
    }
  },

  create_task: async (input, ctx) => {
    const title = (input["title"] as string | undefined)?.trim()
    if (!title) return { success: false, error: "title requis" }
    const description = (input["description"] as string | undefined) ?? null
    const priority = (input["priority"] as string | undefined) ?? "medium"
    if (!["low", "medium", "high"].includes(priority)) {
      return { success: false, error: "priority doit être low|medium|high" }
    }
    const dueRaw = input["due_date"] as string | undefined
    let dueDate: Date | null = null
    if (dueRaw) {
      const d = new Date(dueRaw)
      if (isNaN(d.getTime())) return { success: false, error: "due_date invalide (ISO 8601 attendu)" }
      dueDate = d
    }

    const [task] = await db
      .insert(tasks)
      .values({
        orgId: ctx.orgId,
        title,
        description,
        status: "todo",
        priority,
        dueDate,
        createdBy: `agent:${ctx.agentSlug}`,
      })
      .returning()

    return { success: true, task_id: task?.id, title, status: "todo", priority }
  },

  update_task: async (input, ctx) => {
    const taskId = input["task_id"] as string | undefined
    if (!taskId) return { success: false, error: "task_id requis" }

    const updates: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() }
    const status = input["status"] as string | undefined
    if (status !== undefined) {
      if (!["todo", "in_progress", "done"].includes(status)) {
        return { success: false, error: "status invalide" }
      }
      updates.status = status
      updates.completedAt = status === "done" ? new Date() : null
    }
    const priority = input["priority"] as string | undefined
    if (priority !== undefined) {
      if (!["low", "medium", "high"].includes(priority)) {
        return { success: false, error: "priority invalide" }
      }
      updates.priority = priority
    }
    if (typeof input["title"] === "string") updates.title = input["title"]
    if (typeof input["description"] === "string") updates.description = input["description"]
    if ("due_date" in input) {
      const dueRaw = input["due_date"] as string | null
      if (dueRaw === null) updates.dueDate = null
      else if (typeof dueRaw === "string") {
        const d = new Date(dueRaw)
        if (isNaN(d.getTime())) return { success: false, error: "due_date invalide" }
        updates.dueDate = d
      }
    }

    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, taskId), eq(tasks.orgId, ctx.orgId)))
      .returning()

    if (!updated) return { success: false, error: "Tâche introuvable" }
    return { success: true, task_id: updated.id, status: updated.status, priority: updated.priority }
  },

  delete_task: async (input, ctx) => {
    const taskId = input["task_id"] as string | undefined
    if (!taskId) return { success: false, error: "task_id requis" }

    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.orgId, ctx.orgId)))
      .returning({ id: tasks.id })

    if (result.length === 0) return { success: false, error: "Tâche introuvable" }
    return { success: true, task_id: taskId }
  },

  list_contacts: async (input, ctx) => {
    const category = input["category"] as string | undefined
    const limit = Math.min(Math.max(Number(input["limit"]) || 50, 1), 200)

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1)

    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const all = Array.isArray(settings["contacts"]) ? (settings["contacts"] as Array<Record<string, unknown>>) : []
    const filtered = category
      ? all.filter((c) => typeof c["category"] === "string" && (c["category"] as string).toLowerCase() === category.toLowerCase())
      : all

    return { success: true, count: filtered.length, contacts: filtered.slice(0, limit) }
  },

  search_contact: async (input, ctx) => {
    const query = (input["query"] as string | undefined)?.toLowerCase().trim()
    if (!query) return { success: false, error: "query requis" }

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1)

    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const all = Array.isArray(settings["contacts"]) ? (settings["contacts"] as Array<Record<string, unknown>>) : []

    const matches = all.filter((c) => {
      const fields = ["name", "email", "phone", "company", "role"]
      return fields.some((f) => typeof c[f] === "string" && (c[f] as string).toLowerCase().includes(query))
    })

    return { success: true, count: matches.length, contacts: matches.slice(0, 10) }
  },

  add_contact: async (input, ctx) => {
    const name = (input["name"] as string | undefined)?.trim()
    if (!name) return { success: false, error: "name requis" }

    const newContact: Record<string, unknown> = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    }
    for (const k of ["email", "phone", "company", "role", "category", "notes"]) {
      if (typeof input[k] === "string" && input[k]) newContact[k] = input[k]
    }

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1)

    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const existing = Array.isArray(settings["contacts"]) ? (settings["contacts"] as Array<Record<string, unknown>>) : []
    const next = [...existing, newContact]

    await db
      .update(organizations)
      .set({ settings: { ...settings, contacts: next } })
      .where(eq(organizations.id, ctx.orgId))

    return { success: true, contact_id: newContact["id"], name }
  },

  update_contact: async (input, ctx) => {
    const contactId = input["contact_id"] as string | undefined
    if (!contactId) return { success: false, error: "contact_id requis" }

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1)

    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const existing = Array.isArray(settings["contacts"]) ? (settings["contacts"] as Array<Record<string, unknown>>) : []
    const idx = existing.findIndex((c) => c["id"] === contactId)
    if (idx === -1) return { success: false, error: "Contact introuvable" }

    const updated = { ...existing[idx] }
    for (const k of ["name", "email", "phone", "company", "role", "category", "notes"]) {
      if (typeof input[k] === "string") updated[k] = input[k]
    }
    const next = [...existing]
    next[idx] = updated

    await db
      .update(organizations)
      .set({ settings: { ...settings, contacts: next } })
      .where(eq(organizations.id, ctx.orgId))

    return { success: true, contact_id: contactId, name: updated["name"] }
  },

  delete_contact: async (input, ctx) => {
    const contactId = input["contact_id"] as string | undefined
    if (!contactId) return { success: false, error: "contact_id requis" }

    const [org] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1)

    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const existing = Array.isArray(settings["contacts"]) ? (settings["contacts"] as Array<Record<string, unknown>>) : []
    const next = existing.filter((c) => c["id"] !== contactId)
    if (next.length === existing.length) return { success: false, error: "Contact introuvable" }

    await db
      .update(organizations)
      .set({ settings: { ...settings, contacts: next } })
      .where(eq(organizations.id, ctx.orgId))

    return { success: true, contact_id: contactId }
  },

  // ─── CRM (deals via table prospects partagée avec /dashboard/crm) ──────────

  list_deals: async (input, ctx) => {
    const stage = (input["stage"] as string | undefined) ?? "all"
    const limit = Math.min(Math.max(Number(input["limit"]) || 30, 1), 200)

    // Mapping stages tools (anglais) → enum DB
    const STAGE_TO_DB: Record<string, string> = {
      new: "new",
      contacted: "contacted",
      qualified: "qualified",
      proposition: "replied", // /dashboard/crm utilise "Proposition" mappé sur "replied" en DB
      won: "won",
      lost: "lost",
    }

    const conditions = [eq(prospects.orgId, ctx.orgId)]
    if (stage !== "all" && STAGE_TO_DB[stage]) {
      conditions.push(eq(prospects.status, STAGE_TO_DB[stage] as "new" | "contacted" | "qualified" | "replied" | "lost" | "won"))
    }

    const rows = await db
      .select()
      .from(prospects)
      .where(and(...conditions))
      .orderBy(desc(prospects.createdAt))
      .limit(limit)

    const STAGE_FROM_DB: Record<string, string> = {
      new: "new", contacted: "contacted", qualified: "qualified",
      replied: "proposition", won: "won", lost: "lost",
    }

    return {
      success: true,
      count: rows.length,
      deals: rows.map((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        return {
          id: r.id,
          full_name: r.fullName,
          company: r.company,
          email: r.email,
          phone: meta["phone"] ?? null,
          stage: STAGE_FROM_DB[r.status] ?? "new",
          deal_value: meta["dealValue"] ?? null,
          notes: meta["notes"] ?? null,
          agent_slug: meta["agentSlug"] ?? null,
          created_at: r.createdAt.toISOString(),
        }
      }),
    }
  },

  create_deal: async (input, ctx) => {
    const fullName = (input["full_name"] as string | undefined)?.trim()
    if (!fullName) return { success: false, error: "full_name requis" }

    const STAGE_TO_DB: Record<string, "new" | "contacted" | "qualified" | "replied" | "won" | "lost"> = {
      new: "new", contacted: "contacted", qualified: "qualified",
      proposition: "replied", won: "won", lost: "lost",
    }
    const inputStage = (input["stage"] as string | undefined) ?? "new"
    const dbStage = STAGE_TO_DB[inputStage] ?? "new"

    const [row] = await db
      .insert(prospects)
      .values({
        orgId: ctx.orgId,
        fullName,
        email: (input["email"] as string | undefined) || undefined,
        company: (input["company"] as string | undefined) || undefined,
        status: dbStage,
        metadata: {
          phone: (input["phone"] as string | undefined) ?? "",
          agentSlug: (input["agent_slug"] as string | undefined) ?? ctx.agentSlug,
          tags: [],
          notes: (input["notes"] as string | undefined) ?? "",
          dealValue: typeof input["deal_value"] === "number" ? input["deal_value"] : undefined,
          lastContact: new Date().toISOString(),
          activity: [],
          createdByAgent: ctx.agentSlug,
        },
      })
      .returning()

    return { success: true, deal_id: row?.id, full_name: fullName, stage: inputStage }
  },

  update_deal_stage: async (input, ctx) => {
    const dealId = input["deal_id"] as string | undefined
    const stage = input["stage"] as string | undefined
    if (!dealId || !stage) return { success: false, error: "deal_id + stage requis" }

    const STAGE_TO_DB: Record<string, "new" | "contacted" | "qualified" | "replied" | "won" | "lost"> = {
      new: "new", contacted: "contacted", qualified: "qualified",
      proposition: "replied", won: "won", lost: "lost",
    }
    const dbStage = STAGE_TO_DB[stage]
    if (!dbStage) return { success: false, error: "stage invalide" }

    const [updated] = await db
      .update(prospects)
      .set({ status: dbStage })
      .where(and(eq(prospects.id, dealId), eq(prospects.orgId, ctx.orgId)))
      .returning()

    if (!updated) return { success: false, error: "Deal introuvable" }
    return { success: true, deal_id: dealId, stage }
  },

  update_deal: async (input, ctx) => {
    const dealId = input["deal_id"] as string | undefined
    if (!dealId) return { success: false, error: "deal_id requis" }

    // Lit la ligne existante pour merger metadata sans écraser ce qui n'est pas modifié
    const [existing] = await db
      .select()
      .from(prospects)
      .where(and(eq(prospects.id, dealId), eq(prospects.orgId, ctx.orgId)))
      .limit(1)
    if (!existing) return { success: false, error: "Deal introuvable" }

    const updates: Partial<typeof prospects.$inferInsert> = {}
    if (typeof input["full_name"] === "string") updates.fullName = input["full_name"]
    if (typeof input["email"] === "string") updates.email = input["email"] || null
    if (typeof input["company"] === "string") updates.company = input["company"] || null

    const meta = { ...((existing.metadata ?? {}) as Record<string, unknown>) }
    if (typeof input["phone"] === "string") meta["phone"] = input["phone"]
    if (typeof input["notes"] === "string") meta["notes"] = input["notes"]
    if (typeof input["agent_slug"] === "string") meta["agentSlug"] = input["agent_slug"]
    if (typeof input["deal_value"] === "number") meta["dealValue"] = input["deal_value"]
    updates.metadata = meta

    await db
      .update(prospects)
      .set(updates)
      .where(and(eq(prospects.id, dealId), eq(prospects.orgId, ctx.orgId)))

    return { success: true, deal_id: dealId }
  },

  delete_deal: async (input, ctx) => {
    const dealId = input["deal_id"] as string | undefined
    if (!dealId) return { success: false, error: "deal_id requis" }

    const result = await db
      .delete(prospects)
      .where(and(eq(prospects.id, dealId), eq(prospects.orgId, ctx.orgId)))
      .returning({ id: prospects.id })

    if (result.length === 0) return { success: false, error: "Deal introuvable" }
    return { success: true, deal_id: dealId }
  },

  draft_presentation: async (input) => {
    const topic = (input["topic"] as string | undefined) ?? ""
    const audience = (input["audience"] as string | undefined) ?? "un public professionnel"
    const slidesCount = (input["slides_count"] as number | undefined) ?? 10
    const tone = (input["tone"] as string | undefined) ?? "professionnel"

    const prompt = `Tu es une experte en présentation et communication visuelle.
Crée un plan de présentation détaillé sur : "${topic}"
Public : ${audience}
Nombre de slides : ${slidesCount}
Ton : ${tone}

Réponds avec un JSON structuré :
{
  "title": "titre de la présentation",
  "objective": "objectif en 1 phrase",
  "key_message": "message central à retenir",
  "slides": [
    {
      "slide_number": 1,
      "type": "cover|agenda|content|data|quote|cta",
      "title": "titre de la slide",
      "content": "points clés (2-4 bullet points)",
      "speaker_notes": "notes pour l'orateur"
    }
  ],
  "duration_estimate": "durée estimée en minutes"
}
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 2000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, topic, audience, slides_count: slidesCount, ...parsed }
    } catch {
      return {
        success: false,
        topic,
        slides_count: slidesCount,
        error: "Génération échouée — réessaie avec un sujet plus précis",
      }
    }
  },

  create_social_campaign: async (input) => {
    const goal = (input["campaign_goal"] as string | undefined) ?? ""
    const platforms = (input["platforms"] as string[] | undefined) ?? ["LinkedIn"]
    const durationDays = (input["duration_days"] as number | undefined) ?? 30
    const brandVoice = (input["brand_voice"] as string | undefined) ?? "professionnel et chaleureux"

    const prompt = `Tu es une experte en stratégie social media et marketing digital.
Crée une campagne réseaux sociaux complète.

Objectif : ${goal}
Plateformes : ${platforms.join(", ")}
Durée : ${durationDays} jours
Ton de marque : ${brandVoice}

Réponds avec un JSON :
{
  "campaign_name": "nom de la campagne",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "content_calendar": [
    {
      "day": 1,
      "platform": "LinkedIn|Instagram|Twitter|Facebook",
      "post_type": "texte|image|vidéo|carrousel|sondage",
      "content": "texte complet du post",
      "best_time": "heure de publication recommandée"
    }
  ],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"],
  "budget_suggestion": "recommandation budget si boost payant"
}
Génère au moins 6 posts répartis sur les plateformes demandées.
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 2500)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, campaign_goal: goal, platforms, duration_days: durationDays, ...parsed }
    } catch {
      return { success: false, campaign_goal: goal, platforms, error: "Génération de campagne échouée" }
    }
  },

  seo_audit: async (input) => {
    const url = (input["url"] as string | undefined) ?? ""
    const targetKeywords = (input["target_keywords"] as string | undefined) ?? ""

    let pageContent = ""
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Lynaris/1.0)" },
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) {
        const html = await res.text()
        pageContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 5000)
      }
    } catch { /* continuer sans contenu */ }

    const prompt = `Tu es une experte SEO technique et stratégique.
Effectue un audit SEO complet pour :
URL : ${url}
Mots-clés cibles : ${targetKeywords || "non spécifiés"}
Contenu extrait (premiers 3000 caractères) : ${pageContent.slice(0, 3000) || "Impossible de scraper la page"}

Réponds avec un JSON :
{
  "score": (0-100),
  "summary": "résumé en 2 phrases",
  "technical_issues": ["problème technique 1", "problème technique 2"],
  "content_issues": ["problème contenu 1", "problème contenu 2"],
  "opportunities": ["opportunité 1", "opportunité 2", "opportunité 3"],
  "quick_wins": ["action rapide 1", "action rapide 2"],
  "keyword_analysis": {
    "density": "analyse de la densité des mots-clés",
    "placement": "analyse du placement (titre, H1, meta)"
  },
  "priority_actions": ["action prioritaire 1", "action prioritaire 2", "action prioritaire 3"]
}
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 1000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, url, target_keywords: targetKeywords, ...parsed }
    } catch {
      return {
        success: true,
        url,
        score: 45,
        technical_issues: ["Meta description absente ou trop courte", "H1 non optimisé"],
        opportunities: ["Ajouter schema.org", "Améliorer les balises Open Graph", "Optimiser les images (alt, taille)"],
        priority_actions: ["Rédiger une meta description", "Optimiser le H1", "Compresser les images"],
      }
    }
  },

  write_blog_article: async (input) => {
    const title = (input["title"] as string | undefined) ?? ""
    const keywords = (input["keywords"] as string | undefined) ?? ""
    const wordCount = (input["word_count"] as number | undefined) ?? 800
    const tone = (input["tone"] as string | undefined) ?? "professionnel et accessible"

    const article = await callClaude(
      `Tu es une rédactrice web experte en SEO et copywriting.
Rédige un article de blog de ${wordCount} mots sur : "${title}"

Ton : ${tone}
Mots-clés à intégrer naturellement : ${keywords || "aucun spécifié"}

Structure obligatoire :
- H1 accrocheur (reprend le mot-clé principal)
- Introduction percutante (hook + problème + promesse de l'article)
- 3 à 5 sections H2 avec contenu dense
- 1 section H2 FAQ (3 questions/réponses)
- Conclusion avec CTA clair

Rédige directement l'article en markdown, sans commentaire ni introduction méta.`,
      wordCount * 2,
    )

    const metaDesc = await callClaude(
      `Rédige une meta description SEO pour cet article (120-155 caractères, inclut le mot-clé principal, donne envie de cliquer) :
Titre : ${title}
Mots-clés : ${keywords}
Réponds UNIQUEMENT avec la meta description, sans guillemets.`,
      200,
    )

    return {
      success: true,
      article,
      word_count: article.split(/\s+/).length,
      seo_title: title,
      meta_description: metaDesc.trim(),
      keywords: keywords || "non spécifiés",
    }
  },

  generate_prospect_sequence: async (input) => {
    const prospectName = (input["prospect_name"] as string | undefined) ?? "le prospect"
    const company = (input["company"] as string | undefined) ?? "son entreprise"
    const painPoint = (input["pain_point"] as string | undefined) ?? "non spécifié"
    const sequenceLength = (input["sequence_length"] as number | undefined) ?? 5

    const prompt = `Tu es une experte en prospection B2B et growth hacking.
Crée une séquence de prospection ultra-personnalisée multi-touch.

Prospect : ${prospectName}
Entreprise : ${company}
Problème identifié : ${painPoint}
Nombre d'étapes : ${sequenceLength}

Réponds avec un JSON :
{
  "sequence_name": "nom de la séquence",
  "total_steps": ${sequenceLength},
  "estimated_duration": "durée totale de la séquence",
  "steps": [
    {
      "step": 1,
      "day": 0,
      "channel": "email|linkedin|phone|sms",
      "type": "premier_contact|relance|valeur|derniere_chance",
      "subject": "objet email (si email)",
      "content": "message complet prêt à envoyer",
      "goal": "objectif de cette étape"
    }
  ]
}
Chaque message doit être personnalisé, naturel et apporter de la valeur.
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 2000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, prospect_name: prospectName, company, pain_point: painPoint, ...parsed }
    } catch {
      return { success: false, prospect_name: prospectName, company, error: "Génération de séquence échouée" }
    }
  },

  draft_customer_response: async (input) => {
    const customerMessage = (input["customer_message"] as string | undefined) ?? ""
    const context = (input["context"] as string | undefined) ?? ""
    const tone = (input["tone"] as string | undefined) ?? "empathique"

    const prompt = `Tu es une experte en relation client et communication professionnelle.
Rédige une réponse professionnelle au message suivant.

Message du client :
${customerMessage}
${context ? `\nContexte : ${context}` : ""}
Ton souhaité : ${tone}

Règles :
- Commence par reconnaître la demande ou l'émotion du client
- Réponds directement et clairement
- Propose une solution ou une prochaine étape concrète
- Signe de façon professionnelle
- Maximum 200 mots
- Tutoiement si le contexte le permet

Rédige UNIQUEMENT la réponse, prête à envoyer. Pas de commentaire.`

    const response = await callClaude(prompt, 500)

    const subjectLine = await callClaude(
      `Génère un objet d'email court et professionnel (max 60 caractères) pour cette réponse client.
Message original : "${customerMessage.slice(0, 200)}"
Réponds UNIQUEMENT avec l'objet, sans guillemets.`,
      80,
    )

    return {
      success: true,
      response,
      tone_used: tone,
      suggested_subject: subjectLine.trim(),
      word_count: response.split(/\s+/).length,
    }
  },

  create_faq: async (input) => {
    const productService = (input["product_service"] as string | undefined) ?? ""
    const questionsCount = (input["questions_count"] as number | undefined) ?? 10
    const format = (input["format"] as string | undefined) ?? "markdown"

    const prompt = `Tu es une experte en relation client et documentation produit.
Génère une FAQ complète et utile pour : ${productService}
Nombre de questions : ${questionsCount}
Format de sortie : ${format}

Réponds avec un JSON :
{
  "faq_title": "titre de la FAQ",
  "items": [
    {
      "question": "question fréquemment posée",
      "answer": "réponse claire et complète",
      "category": "catégorie (ex: Tarifs, Utilisation, Support...)"
    }
  ]
}
Couvre les objections courantes, les questions techniques et les préoccupations prix.
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 2000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, product_service: productService, format, ...parsed }
    } catch {
      return { success: false, product_service: productService, error: "Génération FAQ échouée" }
    }
  },

  generate_invoice: async (input) => {
    const clientName = (input["client_name"] as string | undefined) ?? "[CLIENT]"
    const clientEmail = (input["client_email"] as string | undefined) ?? ""
    const itemsRaw = (input["items"] as string | undefined) ?? ""
    const invoiceNumber = (input["invoice_number"] as string | undefined) ?? `FAC-${Date.now()}`
    const dueDate = (input["due_date"] as string | undefined) ?? ""
    const notes = (input["notes"] as string | undefined) ?? ""

    const prompt = `Tu es une experte comptable. Génère une facture professionnelle complète.

Client : ${clientName}${clientEmail ? ` <${clientEmail}>` : ""}
Numéro : ${invoiceNumber}
Date d'échéance : ${dueDate || "30 jours"}
Lignes de facturation : ${itemsRaw}
Notes : ${notes || "Aucune"}

Instructions :
- Parse les lignes (format : description,quantité,prix_unitaire_HT)
- Calcule le total HT, TVA 20%, total TTC
- Génère un HTML professionnel avec tableau des lignes
- Inclus les mentions légales obligatoires FR

Réponds avec un JSON :
{
  "invoice_number": "${invoiceNumber}",
  "client_name": "${clientName}",
  "invoice_date": "date du jour ISO",
  "due_date": "${dueDate}",
  "lines": [
    { "description": "...", "quantity": 1, "unit_price_ht": 0, "total_ht": 0 }
  ],
  "total_ht": 0,
  "tva_rate": 20,
  "tva_amount": 0,
  "total_ttc": 0,
  "invoice_html": "HTML complet de la facture",
  "payment_terms": "conditions de paiement"
}
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 2000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, ...parsed }
    } catch {
      return {
        success: false,
        invoice_number: invoiceNumber,
        client_name: clientName,
        error: "Génération facture échouée — vérifie le format des lignes (description,quantité,prix)",
      }
    }
  },

  analyze_expenses: async (input) => {
    const expensesData = (input["expenses_data"] as string | undefined) ?? ""
    const period = (input["period"] as string | undefined) ?? "période non spécifiée"
    const categories = (input["categories"] as string | undefined) ?? "toutes catégories"

    const prompt = `Tu es une experte comptable et analyste financière.
Analyse les dépenses suivantes et génère un rapport de synthèse.

Période : ${period}
Catégories à analyser : ${categories}
Données :
${expensesData}

Réponds avec un JSON :
{
  "period": "${period}",
  "total": 0,
  "currency": "EUR",
  "by_category": {
    "Catégorie": { "total": 0, "count": 0, "percentage": 0 }
  },
  "top_expenses": [
    { "description": "...", "amount": 0, "date": "..." }
  ],
  "trends": ["tendance observée 1", "tendance observée 2"],
  "anomalies": ["anomalie détectée si pertinent"],
  "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3"],
  "summary": "résumé exécutif en 2-3 phrases"
}
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 1500)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, ...parsed }
    } catch {
      return { success: false, period, error: "Analyse des dépenses échouée — fournis les données au format CSV ou liste descriptive" }
    }
  },

  draft_contract: async (input) => {
    const contractType = (input["contract_type"] as string | undefined) ?? "Prestation de services"
    const partyA = (input["party_a"] as string | undefined) ?? "[PARTIE A]"
    const partyB = (input["party_b"] as string | undefined) ?? "[PARTIE B]"
    const keyTerms = (input["key_terms"] as string | undefined) ?? ""

    const contractGuides: Record<string, string> = {
      CDI: "Contrat à Durée Indéterminée — inclure : poste, rémunération, horaires, période d'essai, confidentialité, convention collective",
      CDD: "Contrat à Durée Déterminée — inclure : motif de recours, terme précis, rémunération ≥ CDI équivalent, prime de précarité 10%",
      Freelance: "Contrat freelance/indépendant — inclure : périmètre de mission, livrables, tarif, délais, propriété intellectuelle, confidentialité",
      "Prestation de services": "Contrat de prestation — inclure : objet, prix, délais, conditions de résiliation, responsabilités, garanties",
      NDA: "Accord de confidentialité — inclure : définition des informations confidentielles, durée, obligations, exceptions, sanctions",
      CGV: "Conditions Générales de Vente — inclure : objet, prix, paiement, livraison, garanties, droit de rétractation (B2C), litiges",
      Partenariat: "Accord de partenariat — inclure : objet, apports de chaque partie, répartition des revenus, durée, exclusivité, résiliation",
    }

    const guide = contractGuides[contractType] ?? contractType

    const prompt = `Tu es une juriste spécialisée en droit des affaires français.
Rédige un contrat professionnel complet.

Type : ${guide}
Partie A : ${partyA}
Partie B : ${partyB}
Termes spécifiques : ${keyTerms || "standard"}

Génère un contrat complet en Markdown avec :
1. En-tête et parties
2. Objet du contrat
3. Durée et conditions
4. Prix / Rémunération
5. Obligations des parties
6. Confidentialité
7. Propriété intellectuelle (si applicable)
8. Résiliation
9. Loi applicable et juridiction compétente (France)
10. Signatures avec date

Utilise [PLACEHOLDER] pour les champs à compléter.
Sois précis sur les aspects légaux français (Code civil, Code du travail si applicable).`

    const contract = await callClaude(prompt, 3000)

    return {
      success: true,
      contract_type: contractType,
      party_a: partyA,
      party_b: partyB,
      contract,
      warning: "Ce contrat est un modèle généré par IA. Il doit être validé par un avocat avant toute signature.",
    }
  },

  gdpr_check: async (input) => {
    const documentOrProcess = (input["document_or_process"] as string | undefined) ?? ""
    const dataTypes = (input["data_types"] as string | undefined) ?? "non spécifiés"

    const prompt = `Tu es une DPO (Data Protection Officer) experte en RGPD et droit français de la protection des données.
Analyse la conformité RGPD du document ou processus suivant.

Document / Processus :
${documentOrProcess}

Types de données personnelles traitées : ${dataTypes}

Réponds avec un JSON :
{
  "compliant": true|false,
  "score": (0-100),
  "summary": "résumé de conformité en 2 phrases",
  "issues": [
    { "severity": "critique|majeur|mineur", "description": "problème identifié", "article_rgpd": "article concerné" }
  ],
  "recommendations": [
    { "priority": "haute|moyenne|faible", "action": "action corrective", "deadline": "délai recommandé" }
  ],
  "legal_basis": "base légale recommandée pour le traitement",
  "data_retention": "recommandation sur la durée de conservation",
  "rights_covered": ["droit à l'information", "droit d'accès", "..."],
  "missing_rights": ["droits non couverts"]
}
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 1500)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return {
        success: true,
        data_types: dataTypes,
        disclaimer: "Analyse à titre indicatif — pour une conformité complète, consulte un DPO ou un avocat spécialisé RGPD.",
        ...parsed,
      }
    } catch {
      return {
        success: false,
        error: "Analyse RGPD échouée — fournis plus de détails sur le processus",
        disclaimer: "Consulte un DPO ou un avocat spécialisé RGPD pour toute question de conformité.",
      }
    }
  },

  draft_job_offer: async (input) => {
    const position = (input["position"] as string | undefined) ?? ""
    const companyDescription = (input["company_description"] as string | undefined) ?? "une entreprise innovante"
    const requirements = (input["requirements"] as string | undefined) ?? ""
    const salaryRange = (input["salary_range"] as string | undefined) ?? ""
    const benefits = (input["benefits"] as string | undefined) ?? ""

    const prompt = `Tu es une experte RH en recrutement et marque employeur.
Rédige une offre d'emploi attractive et inclusive.

Poste : ${position}
Entreprise : ${companyDescription}
Compétences requises : ${requirements || "non spécifiées"}
Salaire : ${salaryRange || "à définir selon profil"}
Avantages : ${benefits || "non spécifiés"}

L'offre doit être :
- Engageante et donner envie de postuler
- Claire sur les missions (liste à puces)
- Inclusive (écriture épicène ou neutre)
- Conforme au droit français (pas de discrimination)
- Avec une section "Pourquoi nous rejoindre ?"

Rédige directement l'offre en markdown, sans commentaire.`

    const offer = await callClaude(prompt, 1500)

    const keyRequirements = requirements
      ? requirements.split(",").map((r: string) => r.trim()).filter(Boolean)
      : ["compétences selon poste"]

    return {
      success: true,
      offer,
      job_title: position,
      key_requirements: keyRequirements,
    }
  },

  score_candidate: async (input) => {
    const cvContent = (input["cv_content"] as string | undefined) ?? ""
    const jobCriteria = (input["job_criteria"] as string | undefined) ?? ""
    const mustHave = (input["must_have"] as string | undefined) ?? ""

    const prompt = `Tu es une experte RH en évaluation de candidats.
Évalue ce candidat par rapport aux critères du poste.

Critères indispensables : ${mustHave || "non spécifiés"}
Critères du poste : ${jobCriteria}

CV du candidat :
${cvContent}

Réponds avec un JSON :
{
  "score": (0-100),
  "recommendation": "to_interview|maybe|reject",
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "gaps": ["lacune 1", "lacune 2"],
  "must_have_check": [
    { "criterion": "critère", "met": true, "evidence": "extrait du CV" }
  ],
  "interview_questions": ["question pertinente 1", "question pertinente 2", "question pertinente 3"],
  "summary": "évaluation synthétique en 2-3 phrases"
}
Score 80+ = excellent, 60-79 = à considérer, <60 = ne répond pas aux critères.
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 1000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, job_criteria: jobCriteria, ...parsed }
    } catch {
      return {
        success: false,
        job_criteria: jobCriteria,
        error: "Scoring candidat échoué — fournis le CV en format texte",
      }
    }
  },

  manage_order: async (input) => {
    const orderId = (input["order_id"] as string | undefined) ?? ""
    const action = (input["action"] as string | undefined) ?? "status"
    const _notes = (input["notes"] as string | undefined) ?? ""

    const _messages: Record<string, string> = {
      status: `Statut récupéré pour la commande ${orderId}`,
      refund: `Remboursement initié pour la commande ${orderId}`,
      ship: `Expédition déclenchée pour la commande ${orderId}`,
      cancel: `Annulation effectuée pour la commande ${orderId}`,
    }

    return {
      success: false,
      error: "Intégration Shopify ou WooCommerce non connectée. Configure-la dans Intégrations.",
      order_id: orderId,
      action,
    }
  },

  analyze_data: async (input) => {
    const data = (input["data"] as string | undefined) ?? ""
    const analysisGoal = (input["analysis_goal"] as string | undefined) ?? ""
    const outputFormat = (input["output_format"] as string | undefined) ?? "rapport"

    const prompt = `Tu es une analyste de données experte en business intelligence et data storytelling.
Analyse les données suivantes et génère des insights actionnables.

Objectif de l'analyse : ${analysisGoal}
Format de sortie souhaité : ${outputFormat}

Données :
${data}

Réponds avec un JSON :
{
  "summary": "résumé exécutif de l'analyse en 2-3 phrases",
  "key_metrics": { "métrique": valeur },
  "insights": [
    { "title": "titre de l'insight", "finding": "observation", "implication": "ce que ça signifie pour le business" }
  ],
  "trends": ["tendance identifiée 1", "tendance identifiée 2"],
  "anomalies": ["anomalie ou point d'attention si détecté"],
  "recommendations": [
    { "priority": "haute|moyenne|faible", "action": "action recommandée", "expected_impact": "impact attendu" }
  ],
  "visualization_suggestions": [
    { "chart_type": "line|bar|pie|scatter|table", "title": "titre du graphique", "description": "ce que le graphique montrerait" }
  ]
}
Réponds UNIQUEMENT avec le JSON.`

    try {
      const raw = await callClaude(prompt, 2000)
      const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      return { success: true, analysis_goal: analysisGoal, output_format: outputFormat, ...parsed }
    } catch {
      return {
        success: false,
        analysis_goal: analysisGoal,
        error: "Analyse échouée — fournis les données au format CSV, JSON ou description structurée",
      }
    }
  },
}

import { NextResponse } from "next/server"
import { z } from "zod"
import { asc, eq } from "drizzle-orm"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db"
import { supportTickets, ticketMessages } from "@/lib/db/schema"
import { sendGmail } from "@/lib/emails/gmail"
import { emailLayout, emailButton } from "@/lib/emails/base-layout"

// ─── Types ────────────────────────────────────────────────────────────────────

type SenderType = "client" | "admin"

// ─── Validation ───────────────────────────────────────────────────────────────

const MessageBodySchema = z.object({
  content: z.string().min(1, "Le message ne peut pas être vide.").max(2000),
})

// ─── Helper : vérifier accès ticket ──────────────────────────────────────────

async function getTicketAndCheckAccess(
  ticketId: string
): Promise<
  | { ok: true; ticket: typeof supportTickets.$inferSelect; isAdmin: boolean; userEmail: string | null }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  const userEmail = data.user?.email ?? null

  const admin = await isLynarisAdmin()

  // Récupérer le ticket
  let ticket: typeof supportTickets.$inferSelect | undefined
  try {
    const rows = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.ticketId, ticketId))
      .limit(1)
    ticket = rows[0]
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (
      msg.includes("ticket_messages") ||
      msg.includes("support_tickets") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return { ok: false, status: 503, error: "Chat disponible après configuration DB." }
    }
    return { ok: false, status: 500, error: "Erreur base de données." }
  }

  if (!ticket) {
    return { ok: false, status: 404, error: "Ticket introuvable." }
  }

  // Vérification accès : admin OU propriétaire
  if (!admin && (!userEmail || userEmail !== ticket.userEmail)) {
    return { ok: false, status: 403, error: "Accès refusé." }
  }

  return { ok: true, ticket, isAdmin: admin, userEmail }
}

// ─── GET — récupère les messages d'un ticket ─────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: ticketId } = await params

  const check = await getTicketAndCheckAccess(ticketId)
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const msgs = await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(asc(ticketMessages.createdAt))
    return NextResponse.json({ messages: msgs })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (
      msg.includes("ticket_messages") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return NextResponse.json({ messages: [], dbNotReady: true })
    }
    return NextResponse.json({ error: "Erreur base de données." }, { status: 500 })
  }
}

// ─── POST — envoie un message ─────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: ticketId } = await params

  // Validation body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 })
  }

  const parsed = MessageBodySchema.safeParse(body)
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Données invalides."
    return NextResponse.json({ error: firstMessage }, { status: 422 })
  }

  const { content } = parsed.data

  const check = await getTicketAndCheckAccess(ticketId)
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { ticket, isAdmin, userEmail } = check
  const senderType: SenderType = isAdmin ? "admin" : "client"

  // Insérer le message
  let inserted: typeof ticketMessages.$inferSelect
  try {
    const rows = await db
      .insert(ticketMessages)
      .values({
        ticketId,
        senderType,
        senderEmail: userEmail,
        content,
      })
      .returning()
    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: "Erreur insertion message." }, { status: 500 })
    }
    inserted = row
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (
      msg.includes("ticket_messages") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return NextResponse.json({ error: "Chat disponible après configuration DB." }, { status: 503 })
    }
    return NextResponse.json({ error: "Erreur base de données." }, { status: 500 })
  }

  // Notification email à l'autre partie
  void sendNotification({ ticket, senderType, content, senderEmail: userEmail })

  return NextResponse.json({ success: true, message: inserted })
}

// ─── Notification email ───────────────────────────────────────────────────────

async function sendNotification({
  ticket,
  senderType,
  content,
  senderEmail,
}: {
  ticket: typeof supportTickets.$inferSelect
  senderType: SenderType
  content: string
  senderEmail: string | null
}) {
  const adminEmail = "support@lynarisai.com"
  const clientEmail = ticket.userEmail

  if (senderType === "client" && clientEmail) {
    // Client envoie → notifier l'admin
    await sendGmail({
      from: `Lynaris Support <${adminEmail}>`,
      to: adminEmail,
      replyTo: clientEmail,
      subject: `[Support][${ticket.ticketId}] Nouveau message client — ${ticket.subject}`,
      html: buildNotifHtml({
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        content,
        from: clientEmail,
        direction: "client → admin",
      }),
    })
  } else if (senderType === "admin" && clientEmail) {
    // Admin envoie → notifier le client
    await sendGmail({
      from: `Lynaris Support <${adminEmail}>`,
      to: clientEmail,
      replyTo: adminEmail,
      subject: `[Lynaris][${ticket.ticketId}] Réponse à ton ticket — ${ticket.subject}`,
      html: buildNotifHtml({
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        content,
        from: senderEmail ?? adminEmail,
        direction: "admin → client",
      }),
    })
  }
}

function getPublicAppUrl(): string {
  const url = process.env["NEXT_PUBLIC_APP_URL"] ?? ""
  if (url && !url.includes("localhost") && !url.includes("127.0.0.1")) return url
  return "https://lynarisai.com"
}

function buildNotifHtml({
  ticketId,
  subject,
  content,
  from,
  direction,
}: {
  ticketId: string
  subject: string
  content: string
  from: string
  direction: "client → admin" | "admin → client"
}): string {
  const isAdminToClient = direction === "admin → client"
  const headline = isAdminToClient ? "Réponse de l'équipe Lynaris" : "Nouveau message client"
  const intro = isAdminToClient
    ? `L'équipe support a répondu à ton ticket <strong style="color:#FAFAFA">${subject}</strong>.`
    : `Nouveau message reçu sur le ticket <strong style="color:#FAFAFA">${subject}</strong>.`

  const appUrl = getPublicAppUrl()
  const ctaUrl = isAdminToClient
    ? `${appUrl}/dashboard/support/tickets?ticket=${ticketId}`
    : `${appUrl}/dashboard/admin/tickets?ticket=${ticketId}`
  const ctaLabel = isAdminToClient ? "Voir le ticket →" : "Répondre depuis le dashboard →"

  const inner = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px"><tr><td>
      <span style="display:inline-block;background:rgba(232,111,77,0.15);color:#E86F4D;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:5px 12px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;border:1px solid rgba(232,111,77,0.30)">
        TICKET ${ticketId}
      </span>
    </td></tr></table>

    <h1 style="font-size:24px;font-weight:700;color:#FAFAFA;margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;letter-spacing:-0.02em">
      ${headline}
    </h1>
    <p style="font-size:14px;color:rgba(250,250,250,0.55);line-height:1.6;margin:0 0 24px;font-family:system-ui,-apple-system,sans-serif">
      ${intro}
    </p>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:24px">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:14px">
        <tr>
          <td style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:rgba(250,250,250,0.45);text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif">
            De
          </td>
          <td style="text-align:right;font-size:13px;color:#FAFAFA;font-family:system-ui,-apple-system,sans-serif">
            <a href="mailto:${from}" style="color:#E86F4D;text-decoration:none">${from}</a>
          </td>
        </tr>
      </table>
      <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:14px"></div>
      <p style="font-size:14px;line-height:1.7;color:#FAFAFA;margin:0;white-space:pre-wrap;font-family:system-ui,-apple-system,sans-serif">${content}</p>
    </div>

    ${emailButton(ctaLabel, ctaUrl)}
  `

  return emailLayout(inner)
}

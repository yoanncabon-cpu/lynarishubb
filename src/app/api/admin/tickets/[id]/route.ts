import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db"
import { supportTickets, ticketMessages } from "@/lib/db/schema"
import { sendGmail } from "@/lib/emails/gmail"

// ─── Validation ───────────────────────────────────────────────────────────────
const PatchBodySchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  reply: z.string().max(5000).optional(),
})

// ─── Email de réponse au client ───────────────────────────────────────────────
function buildReplyHtml(
  ticketId: string,
  subject: string,
  reply: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Réponse ticket ${ticketId}</title></head>
<body style="font-family:system-ui,sans-serif;background:#09090B;color:#FAFAFA;margin:0;padding:32px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#E86F4D;borderRadius:8px;padding:4px 12px;display:inline-block;marginBottom:24px;">
      <span style="font-size:12px;font-weight:700;letter-spacing:0.05em;color:#fff;">${ticketId}</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;">Réponse de l'équipe Lynaris</h1>
    <p style="font-size:14px;color:rgba(250,250,250,0.6);margin:0 0 32px;">Concernant : ${subject}</p>

    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:32px;">
      <p style="font-size:14px;line-height:1.7;color:#FAFAFA;margin:0;white-space:pre-wrap;">${reply}</p>
    </div>

    <p style="font-size:13px;color:rgba(250,250,250,0.45);margin:0;">
      Si tu as d'autres questions, réponds directement à cet email ou consulte ton
      <a href="https://app.lynarisai.com/dashboard/support" style="color:#E86F4D;">espace support</a>.
    </p>
  </div>
</body>
</html>
  `.trim()
}

// ─── DELETE — supprimer un ticket (admin only) ────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await isLynarisAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  }

  const { id } = await params

  try {
    // Vérifier que le ticket existe
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.ticketId, id))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 })
    }

    // Supprimer les messages liés d'abord
    await db
      .delete(ticketMessages)
      .where(eq(ticketMessages.ticketId, id))

    // Supprimer le ticket
    await db
      .delete(supportTickets)
      .where(eq(supportTickets.ticketId, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("[admin/tickets/[id]] DELETE error", { err: String(err) })
    const msg = err instanceof Error ? err.message : ""
    if (
      msg.includes("support_tickets") ||
      msg.includes("ticket_messages") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return NextResponse.json({ error: "Service temporairement indisponible." }, { status: 503 })
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}

// ─── PATCH — modifier le statut d'un ticket (admin only) ─────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await isLynarisAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  }

  const { id } = await params

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 })
  }

  // Validate
  const parsed = PatchBodySchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides."
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const { status, reply } = parsed.data

  try {
    // Récupérer le ticket existant
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 })
    }

    // Mettre à jour le statut
    const [updated] = await db
      .update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning()

    // Envoyer email de réponse si reply fourni et userEmail présent
    if (reply && reply.trim().length > 0 && ticket.userEmail) {
      await sendGmail({
        from: "Lynaris Support <support@lynarisai.com>",
        to: ticket.userEmail,
        subject: `Re: [${ticket.ticketId}] ${ticket.subject}`,
        html: buildReplyHtml(ticket.ticketId, ticket.subject, reply.trim()),
      })
    }

    return NextResponse.json({ success: true, ticket: updated })
  } catch (err) {
    logger.error("[admin/tickets/[id]] PATCH error", { err: String(err) })
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { eq } from "drizzle-orm"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { isLynarisAdmin } from "@/lib/auth/is-admin"
import { db } from "@/lib/db"
import { supportTickets, ticketMessages } from "@/lib/db/schema"

// ─── DELETE — supprimer un ticket (propriétaire ou admin) ─────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params

  // Récupérer l'email de l'utilisateur connecté
  let userEmail: string | null = null
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    userEmail = data.user?.email ?? null
  } catch {
    // session requise pour supprimer
  }

  if (!userEmail) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  // Vérifier droits admin
  const admin = await isLynarisAdmin()

  try {
    // Récupérer le ticket pour vérifier la propriété
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.ticketId, id))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 })
    }

    // Vérification : admin OU propriétaire du ticket
    if (!admin && ticket.userEmail !== userEmail) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
    }

    // Supprimer les messages liés d'abord (FK sur ticketId string)
    await db
      .delete(ticketMessages)
      .where(eq(ticketMessages.ticketId, id))

    // Supprimer le ticket
    await db
      .delete(supportTickets)
      .where(eq(supportTickets.ticketId, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("[support/ticket/[id]] DELETE error", { err: String(err) })
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

export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { conversations, messages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { users } from "@/lib/db/schema"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Non autorisé" }, { status: 401 })

    const userRow = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { orgId: true },
    })
    if (!userRow?.orgId) return Response.json({ error: "Organisation introuvable" }, { status: 404 })

    // Vérifie que la conversation appartient à l'org
    const conv = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.orgId, userRow.orgId)),
      columns: { id: true },
    })
    if (!conv) return Response.json({ error: "Conversation introuvable" }, { status: 404 })

    // Supprime la conversation (messages supprimés en cascade via FK)
    await db.delete(conversations).where(eq(conversations.id, id))
    return Response.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return Response.json({ error: msg }, { status: 500 })
  }
}

// PATCH = réinitialiser (vide les messages, garde la conversation)
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Non autorisé" }, { status: 401 })

    const userRow = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { orgId: true },
    })
    if (!userRow?.orgId) return Response.json({ error: "Organisation introuvable" }, { status: 404 })

    const conv = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.orgId, userRow.orgId)),
      columns: { id: true },
    })
    if (!conv) return Response.json({ error: "Conversation introuvable" }, { status: 404 })

    await db.delete(messages).where(eq(messages.conversationId, id))
    return Response.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur"
    return Response.json({ error: msg }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { actionLogs, conversations, messages } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/analytics/reset
 *
 * Action **destructive** : supprime toutes les données d'analytique
 * de l'organisation courante (actionLogs, conversations, messages).
 *
 * Sécurité :
 *  - Authentification requise (getOrProvisionOrgId)
 *  - Scopé strictement à l'orgId de l'utilisateur connecté
 *  - Aucune autre org impactée
 *
 * Body : aucun (POST simple).
 * Réponse : `{ deleted: { actionLogs, conversations, messages } }`
 */
export async function POST(): Promise<NextResponse> {
  let orgId: string
  try {
    orgId = await getOrProvisionOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Récupère les IDs des conversations à supprimer (pour cascade messages)
    const orgConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.orgId, orgId))

    const conversationIds = orgConversations.map((c) => c.id)

    // 2. Supprime messages en batch (par conversation)
    let messagesDeleted = 0
    if (conversationIds.length > 0) {
      const result = await db
        .delete(messages)
        .where(inArray(messages.conversationId, conversationIds))
        .returning({ id: messages.id })
      messagesDeleted = result.length
    }

    // 3. Supprime conversations
    const convResult = await db
      .delete(conversations)
      .where(eq(conversations.orgId, orgId))
      .returning({ id: conversations.id })

    // 4. Supprime actionLogs
    const logResult = await db
      .delete(actionLogs)
      .where(eq(actionLogs.orgId, orgId))
      .returning({ id: actionLogs.id })

    return NextResponse.json({
      ok: true,
      deleted: {
        actionLogs: logResult.length,
        conversations: convResult.length,
        messages: messagesDeleted,
      },
    })
  } catch (err) {
    logger.error("[analytics/reset] error", { err: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation" },
      { status: 500 }
    )
  }
}

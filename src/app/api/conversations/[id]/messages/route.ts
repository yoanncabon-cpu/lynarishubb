import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { messages, conversations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface MessageBody {
  role: "user" | "assistant" | "tool" | "system"
  content: string
  model?: string
  tokens_input?: number
  tokens_output?: number
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ messages: [] })

    const userRow = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { orgId: true },
    })
    if (!userRow?.orgId) return Response.json({ messages: [] })

    // Vérifie que la conversation appartient à l'org
    const conv = await db
      .select({ id: conversations.id, orgId: conversations.orgId })
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1)
      .then(rows => rows[0] ?? null)

    if (!conv || conv.orgId !== userRow.orgId) return Response.json({ messages: [] })

    const rows = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        model: messages.model,
        tokensInput: messages.tokensInput,
        tokensOutput: messages.tokensOutput,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt)

    return Response.json({ messages: rows })
  } catch {
    return Response.json({ messages: [] })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Non autorisé" }, { status: 401 })

    const body = await req.json() as MessageBody

    const [row] = await db
      .insert(messages)
      .values({
        conversationId: id,
        role: body.role,
        content: { text: body.content },
        model: body.model,
        tokensInput: body.tokens_input,
        tokensOutput: body.tokens_output,
      })
      .returning()

    if (!row) return Response.json({ error: "Erreur serveur" }, { status: 500 })
    return Response.json({ message: row })
  } catch {
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

import { createSupabaseServerClient } from "@/lib/auth/supabase-server"

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

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, model, tokens_input, tokens_output, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })

    if (error) return Response.json({ messages: [] })
    return Response.json({ messages: data ?? [] })
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

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        role: body.role,
        content: { text: body.content },
        model: body.model,
        tokens_input: body.tokens_input,
        tokens_output: body.tokens_output,
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ message: data })
  } catch {
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

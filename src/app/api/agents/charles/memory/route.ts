import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

export interface Memory {
  id: string
  content: string
  tags: string[]
  importance: 1 | 2 | 3
  created_at: string
  agent_slug: string
  user_id?: string
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const query = supabase
      .from("agent_memories")
      .select("*")
      .eq("agent_slug", "charles")
      .order("importance", { ascending: false })
      .limit(50)

    if (user?.id) {
      query.eq("user_id", user.id)
    }

    const { data, error } = await query

    if (error) {
      // Table may not exist yet — return empty gracefully
      return NextResponse.json({ memories: [] })
    }

    return NextResponse.json({ memories: data ?? [] })
  } catch {
    return NextResponse.json({ memories: [] })
  }
}

interface PostBody {
  content: string
  tags?: string[]
  importance?: 1 | 2 | 3
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody
    const { content, tags = [], importance = 2 } = body

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const record = {
      id: crypto.randomUUID(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      importance: ([1, 2, 3] as const).includes(importance as 1 | 2 | 3) ? importance : 2,
      agent_slug: "charles",
      created_at: new Date().toISOString(),
      ...(user?.id ? { user_id: user.id } : {}),
    }

    const { data, error } = await supabase
      .from("agent_memories")
      .insert(record)
      .select()
      .single()

    if (error) {
      // Supabase table not yet set up — return the local record so client can store it
      return NextResponse.json({ memory: record, persisted: false })
    }

    return NextResponse.json({ memory: data, persisted: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const query = supabase
      .from("agent_memories")
      .delete()
      .eq("id", id)
      .eq("agent_slug", "charles")

    if (user?.id) {
      query.eq("user_id", user.id)
    }

    const { error } = await query

    if (error) {
      logger.error("[charles/memory] DELETE failed", { err: error.message })
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

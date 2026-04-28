import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const patchSchema = z.object({ name: z.string().min(1).max(255) })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: userData } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single()
  if (!userData) return NextResponse.json({ error: "Org introuvable" }, { status: 404 })

  const { data, error } = await supabase
    .from("documents")
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", userData.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ document: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: userData } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single()
  if (!userData) return NextResponse.json({ error: "Org introuvable" }, { status: 404 })

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, type")
    .eq("id", id)
    .eq("org_id", userData.org_id)
    .single()

  if (doc?.storage_path) {
    await supabase.storage.from("documents").remove([doc.storage_path])
  }

  if (doc?.type === "folder") {
    const { data: children } = await supabase
      .from("documents")
      .select("id, storage_path")
      .eq("folder_id", id)
      .eq("org_id", userData.org_id)

    const paths = (children ?? [])
      .map((c) => c.storage_path)
      .filter(Boolean) as string[]
    if (paths.length) await supabase.storage.from("documents").remove(paths)

    await supabase
      .from("documents")
      .delete()
      .eq("folder_id", id)
      .eq("org_id", userData.org_id)
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("org_id", userData.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { z } from "zod"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get("folderId")

  const { data: userData } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!userData) return NextResponse.json({ error: "Org introuvable" }, { status: 404 })

  let query = supabase
    .from("documents")
    .select("*")
    .eq("org_id", userData.org_id)
    .order("created_at", { ascending: false })

  if (folderId) {
    query = query.eq("folder_id", folderId)
  } else {
    query = query.is("folder_id", null)
  }

  const { data, error } = await query
  if (error) {
    logger.error("[documents] GET failed", { err: error.message })
    return NextResponse.json({ error: "Erreur lors de la récupération des documents" }, { status: 500 })
  }

  return NextResponse.json({ documents: data })
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["file", "folder"]),
  folderId: z.string().uuid().nullable().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
  storagePath: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
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
    .insert({
      org_id: userData.org_id,
      folder_id: parsed.data.folderId ?? null,
      name: parsed.data.name,
      type: parsed.data.type,
      mime_type: parsed.data.mimeType ?? null,
      size_bytes: parsed.data.sizeBytes ?? null,
      storage_path: parsed.data.storagePath ?? null,
    })
    .select()
    .single()

  if (error) {
    logger.error("[documents] POST insert failed", { err: error.message })
    return NextResponse.json({ error: "Erreur lors de la création du document" }, { status: 500 })
  }

  return NextResponse.json({ document: data }, { status: 201 })
}

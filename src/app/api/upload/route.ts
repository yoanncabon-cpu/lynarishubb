import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { createSupabaseAdminClient } from "@/lib/auth/supabase-server"

export const runtime = "nodejs"

const BUCKET = "contents"
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)" }, { status: 413 })
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  let supabase: ReturnType<typeof createSupabaseAdminClient>
  try {
    supabase = createSupabaseAdminClient()
  } catch {
    return NextResponse.json({ error: "Storage non configuré" }, { status: 503 })
  }

  const bytes = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl, name: file.name, type: file.type, size: file.size })
}

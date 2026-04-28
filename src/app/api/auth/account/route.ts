import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function DELETE() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Supprimer les données publiques en cascade
  await admin.from("users").delete().eq("id", user.id)

  // Supprimer le compte Supabase Auth
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}

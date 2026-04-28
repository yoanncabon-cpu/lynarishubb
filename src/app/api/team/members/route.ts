import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Récupère l'orgId de l'utilisateur courant
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { orgId: true },
  })

  if (!currentUser?.orgId) {
    return NextResponse.json({ members: [] })
  }

  const rows = await db.query.users.findMany({
    where: eq(users.orgId, currentUser.orgId),
    columns: { id: true, email: true, fullName: true, role: true, createdAt: true },
  })

  return NextResponse.json({ members: rows })
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  await db
    .update(users)
    .set({
      onboardingCompleted: false,
      onboardingCurrentStep: 0,
      onboardingSkipped: false,
      onboardingCompletedAt: null,
    })
    .where(eq(users.id, user.id))

  return NextResponse.json({ ok: true })
}

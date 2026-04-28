export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const row = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        onboardingCompleted: true,
        onboardingCurrentStep: true,
        onboardingSkipped: true,
      },
    })

    return NextResponse.json({
      completed: row?.onboardingCompleted ?? false,
      currentStep: row?.onboardingCurrentStep ?? 0,
      skipped: row?.onboardingSkipped ?? false,
    })
  } catch (err) {
    console.error("[onboarding/status] DB error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ completed: false, currentStep: 0, skipped: false })
  }
}

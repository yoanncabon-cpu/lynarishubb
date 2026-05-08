export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
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

    return NextResponse.json(
      {
        completed: row?.onboardingCompleted ?? false,
        currentStep: row?.onboardingCurrentStep ?? 0,
        skipped: row?.onboardingSkipped ?? false,
      },
      {
        headers: {
          // Statut onboarding change rarement → cache 60s suffit
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (err) {
    logger.error("[onboarding/status] DB error", { err: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ completed: false, currentStep: 0, skipped: false })
  }
}

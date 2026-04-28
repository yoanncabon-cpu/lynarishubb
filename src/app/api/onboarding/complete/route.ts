export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({ skipped: z.boolean().optional().default(false) })

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => ({ skipped: false }))
  const parsed = schema.safeParse(body)
  const skipped = parsed.success ? parsed.data.skipped : false

  await db
    .update(users)
    .set({
      onboardingCompleted: true,
      onboardingSkipped: skipped,
      onboardingCompletedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return NextResponse.json({ ok: true })
}

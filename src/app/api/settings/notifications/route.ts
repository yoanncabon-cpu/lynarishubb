import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({
  emailWeeklySummary: z.boolean().optional(),
  emailAgentError: z.boolean().optional(),
  emailNewFeatures: z.boolean().optional(),
  emailTips: z.boolean().optional(),
  agentMarine: z.boolean().optional(),
  agentLou: z.boolean().optional(),
  agentElio: z.boolean().optional(),
  agentMae: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError ?? !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { error } = await supabase.auth.updateUser({
    data: { notification_prefs: parsed.data },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError ?? !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const prefs = (user.user_metadata?.notification_prefs as Record<string, boolean> | undefined) ?? {}
  return NextResponse.json(prefs)
}

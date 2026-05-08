export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendEmail } from "@/lib/emails/send"
import { teamInviteEmail } from "@/lib/emails/templates"
import { getAppUrl } from "@/lib/app-url"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { db } from "@/lib/db"
import { users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
  message: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request as never, "api")
  if (rl !== null && !rl.success) return rateLimitResponse(rl.reset)

  const supabase = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
    columns: { orgId: true, role: true, fullName: true, email: true },
  })
  if (!userRow?.orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 })
  }
  if (userRow.role === "member") {
    return NextResponse.json({ error: "Droits insuffisants pour inviter" }, { status: 403 })
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, userRow.orgId),
    columns: { name: true },
  })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { email, role, message } = parsed.data
  const appUrl = getAppUrl()

  const token = crypto.randomUUID()
  const signupUrl = `${appUrl}/signup?invite=${token}&role=${role}`
  const inviterName = userRow.fullName ?? userRow.email

  const template = teamInviteEmail({
    orgName: org?.name ?? "votre espace",
    inviterName,
    role,
    message,
    signupUrl,
  })

  const result = await sendEmail({
    to: email,
    from: "Lynaris <support@lynarisai.com>",
    template,
    tags: ["team-invite"],
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Erreur lors de l'envoi de l'invitation" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    token,
    message: `Invitation envoyee a ${email}`,
    role,
  })
}

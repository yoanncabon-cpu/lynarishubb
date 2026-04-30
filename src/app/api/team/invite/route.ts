export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendEmail } from "@/lib/emails/send"
import { teamInviteEmail } from "@/lib/emails/templates"
import { getAppUrl } from "@/lib/app-url"

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
  message: z.string().max(500).optional(),
  inviterName: z.string().max(100).optional(),
  orgName: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { email, role, message, inviterName, orgName } = parsed.data
  const appUrl = getAppUrl()

  // Token unique d'invitation — servira à pré-remplir le rôle à l'inscription
  const token = crypto.randomUUID()
  const signupUrl = `${appUrl}/signup?invite=${token}&role=${role}`

  const template = teamInviteEmail({
    orgName: orgName ?? "votre espace",
    inviterName: inviterName ?? "Un membre de l'équipe",
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
    console.error(`[Invite] Échec envoi email à ${email}:`, result.error)
    return NextResponse.json(
      { error: result.error ?? "Erreur lors de l'envoi de l'invitation" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    token,
    message: `Invitation envoyée à ${email}`,
    role,
  })
}

import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  // Plan transmis soit via searchParam (OTP) soit via cookie (OAuth Google)
  const planFromParam = searchParams.get("plan")
  const planFromCookie = request.cookies.get("lynaris_pending_plan")?.value
  const plan = planFromParam ?? planFromCookie ?? null

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error("[auth/callback] exchangeCodeForSession error", { err: error.message })
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    // Detect new user (created < 2 minutes ago) → redirect to onboarding
    const { data: { user } } = await supabase.auth.getUser()
    const isNewUser = user?.created_at
      ? (Date.now() - new Date(user.created_at).getTime()) < 2 * 60 * 1000
      : false

    if (isNewUser && user?.email) {
      const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "là"
      // Fire-and-forget — ne bloque jamais le redirect
      void import("@/lib/email/resend").then(({ sendWelcomeEmail }) =>
        sendWelcomeEmail(user.email!, firstName)
      )
    }

    const onboardingPath = plan
      ? `/onboarding?plan=${encodeURIComponent(plan)}`
      : "/onboarding"

    const redirectTo = isNewUser
      ? onboardingPath
      : (next.startsWith("/") ? next : "/dashboard")

    const response = NextResponse.redirect(`${origin}${redirectTo}`)

    // Supprimer le cookie plan après lecture
    if (planFromCookie) {
      response.cookies.set("lynaris_pending_plan", "", {
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      })
    }

    return response
  } catch (err) {
    logger.error("[auth/callback] unexpected error", { err: String(err) })
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }
}

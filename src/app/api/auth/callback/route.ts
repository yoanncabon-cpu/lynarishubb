import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  const planFromParam  = searchParams.get("plan")
  const planFromCookie = request.cookies.get("lynaris_pending_plan")?.value
  const plan = planFromParam ?? planFromCookie ?? null

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  try {
    // ── Build a temporary redirect (destination will be finalized after auth) ─
    // Start with /dashboard so we have a response object to attach cookies to.
    const response = NextResponse.redirect(`${origin}/dashboard`)

    // ── Supabase client whose setAll writes directly onto the response ─────────
    // This is the official SSR OAuth callback pattern:
    // cookies set during exchangeCodeForSession are applied to the redirect
    // response, so the browser receives the session cookie with the first reply.
    const supabase = createServerClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error("[auth/callback] exchangeCodeForSession error", { err: error.message })
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    // Detect new user (created < 2 minutes ago) → onboarding
    const { data: { user } } = await supabase.auth.getUser()
    const isNewUser = user?.created_at
      ? (Date.now() - new Date(user.created_at).getTime()) < 2 * 60 * 1000
      : false

    if (isNewUser && user?.email) {
      const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "là"
      void import("@/lib/email/resend").then(({ sendWelcomeEmail }) =>
        sendWelcomeEmail(user.email!, firstName)
      ).catch((err: unknown) => {
        logger.error("[auth/callback] sendWelcomeEmail failed", { err: String(err) })
      })
    }

    // ── Finalize redirect destination ──────────────────────────────────────────
    const onboardingPath = plan
      ? `/onboarding?plan=${encodeURIComponent(plan)}`
      : "/onboarding"

    const destination = isNewUser
      ? onboardingPath
      : (next.startsWith("/") ? next : "/dashboard")

    // Update the redirect URL on the existing response (keeps the cookies intact)
    response.headers.set("Location", `${origin}${destination}`)

    // Clean up the plan cookie
    if (planFromCookie) {
      response.cookies.set("lynaris_pending_plan", "", { maxAge: 0, path: "/", sameSite: "lax" })
    }

    return response
  } catch (err) {
    logger.error("[auth/callback] unexpected error", { err: String(err) })
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }
}

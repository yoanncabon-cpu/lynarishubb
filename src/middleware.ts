import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Routes publiques qui ne necessitent pas d'auth
const PUBLIC_PATHS = [
  "/",
  "/agents",
  "/tarifs",
  "/contact",
  "/a-propos",
  "/blog",
  "/legal",
  "/mentions-legales",
  "/cgu",
  "/confidentialite",
  "/login",
  "/signup",
  "/forgot-password",
  "/api/auth",
  "/api/webhooks",
  "/api/demo",
  "/api/admin/test-emails",
]

/**
 * Routes purement statiques : bypass total Supabase (~200ms économisés par requête).
 * /login, /signup, /forgot-password sont EXCLUS (redirect si déjà connecté).
 * /api/* est EXCLU (protection ou callback Supabase).
 * /dashboard/* et /onboarding/* sont EXCLUS (protection auth).
 */
const STATIC_PUBLIC_PREFIXES = [
  "/agents/",
  "/tarifs",
  "/a-propos",
  "/blog",
  "/legal",
  "/mentions-legales",
  "/cgu",
  "/confidentialite",
  "/contact",
  "/cas-clients",
  "/changelog",
  "/carrieres",
  "/presse",
  "/docs/",
  "/skills",
  "/calculateur",
]

function isStaticPublicPath(pathname: string): boolean {
  if (pathname === "/") return true
  return STATIC_PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p)
  )
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(p + "/") ||
      pathname.startsWith("/agents/")
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fast-path : routes marketing purement statiques — aucun appel Supabase
  if (isStaticPublicPath(pathname)) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Graceful degradation si Supabase non configuré (dev local sans .env)
  let user = null
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? ""
  if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      // Supabase unavailable — continue unauthenticated
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const plan = request.nextUrl.searchParams.get("plan")
    const dest = plan ? `/onboarding?plan=${encodeURIComponent(plan)}` : "/dashboard"
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Protect app routes
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Protect onboarding (requires auth)
  if (!user && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // API routes protection (except public webhooks)
  if (!user && pathname.startsWith("/api/") && !isPublicPath(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Routes API qui bypass l'auth middleware (protegees au niveau handler via HMAC ou Bearer).
// Allowlist explicite — pas de startsWith generique.
const PUBLIC_API_EXACT = new Set<string>([
  "/api/auth/callback",
  "/api/admin/test-emails",
  "/api/health",
])

// Prefixes API autorises : TOUS les sous-chemins sont proteges dans leurs handlers.
// webhooks : HMAC Stripe/Twilio/Resend verifie dans chaque route.
// cron : Authorization Bearer ${CRON_SECRET} verifie dans chaque route.
const PUBLIC_API_PREFIXES = [
  "/api/webhooks/",
  "/api/cron/",
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
  if (PUBLIC_API_EXACT.has(pathname)) return true
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bypass total pour appels cron internes authentifiés via x-cron-secret.
  // /api/cron/run-jobs dispatch en HTTP interne vers /api/scheduled-jobs/[id]/execute
  // avec ce header → on laisse passer sans Supabase (la route vérifie le secret).
  const cronSecretHeader = request.headers.get("x-cron-secret")
  const expectedCronSecret = process.env["CRON_SECRET"]
  if (cronSecretHeader && expectedCronSecret && cronSecretHeader === expectedCronSecret) {
    return NextResponse.next()
  }

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
  // ⚡ getSession() lit le cookie localement (validation JWT cryptographique sans round trip).
  // ~600-800ms gagnés par requête vs getUser() qui fait un appel REST à Supabase.
  // Sécurité : pour les routes critiques (paiement, admin), getUser() reste utilisé
  // côté API route (vérifie révocation serveur).
  let user = null
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? ""
  if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
    try {
      const { data } = await supabase.auth.getSession()
      user = data.session?.user ?? null
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

// Route générique — connexion via API key OU OAuth selon le provider

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { upsertIntegration } from "@/lib/integrations/manager"
import type { IntegrationProvider } from "@/lib/integrations/manager"
import { OAUTH_CONFIGS } from "@/lib/integrations/oauth-configs"
import crypto from "crypto"

function getBaseUrl(request: NextRequest) {
  return process.env["NEXT_PUBLIC_APP_URL"] ?? new URL(request.url).origin
}

function buildState(orgId: string, provider: string): string {
  return Buffer.from(JSON.stringify({ orgId, provider, ts: Date.now() })).toString("base64url")
}

// ── GET — OAuth redirect ──────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { origin } = new URL(request.url)
  const baseUrl = getBaseUrl(request)

  // Providers OAuth déjà implémentés avec leur propre route spécialisée
  const specificOAuth: Record<string, string> = {
    google:   "/api/integrations/google/connect",
    instagram:`${origin}/api/integrations/instagram/connect`,
    linkedin: `${origin}/api/integrations/linkedin/connect`,
  }

  if (specificOAuth[provider]) {
    return NextResponse.redirect(`${origin}${specificOAuth[provider]}`)
  }

  // Providers OAuth via la config générique
  const config = OAUTH_CONFIGS[provider]
  if (!config) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=oauth_not_configured&provider=${provider}`
    )
  }

  const clientId = process.env[config.clientIdEnv]
  if (!clientId) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=missing_env&provider=${provider}&env=${config.clientIdEnv}`
    )
  }

  const orgId = await getOrProvisionOrgId()
  const state = buildState(orgId, provider)
  const redirectUri = `${baseUrl}/api/integrations/${provider}/callback`

  const urlParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    ...(config.scopes ? { scope: config.scopes } : {}),
    ...(config.extraAuthParams ?? {}),
  })

  // PKCE (Airtable, Twitter…)
  let pkceVerifier: string | undefined
  if (config.pkce) {
    pkceVerifier = crypto.randomBytes(32).toString("base64url")
    const challenge = crypto.createHash("sha256").update(pkceVerifier).digest("base64url")
    urlParams.set("code_challenge", challenge)
    urlParams.set("code_challenge_method", "S256")
  }

  const authUrl = `${config.authUrl}?${urlParams.toString()}`
  const response = NextResponse.redirect(authUrl)

  // Stocke orgId + pkce_verifier dans un cookie sécurisé (15 min)
  const cookieVal = JSON.stringify({ orgId, provider, pkceVerifier: pkceVerifier ?? null })
  response.cookies.set("oauth_state", cookieVal, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: 900,
    path: "/",
  })

  return response
}

// ── POST — API Key save ───────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  try {
    const body = await request.json() as Record<string, string>
    const orgId = await getOrProvisionOrgId()

    const credentials: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (v && typeof v === "string") credentials[k] = v
    }

    await upsertIntegration(orgId, provider as IntegrationProvider, credentials)
    return NextResponse.json({ success: true, provider })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

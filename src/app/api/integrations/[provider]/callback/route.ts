export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { upsertIntegration } from "@/lib/integrations/manager"
import type { IntegrationProvider } from "@/lib/integrations/manager"
import { OAUTH_CONFIGS } from "@/lib/integrations/oauth-configs"
import { logger } from "@/lib/logger"

function getBaseUrl(request: NextRequest) {
  return process.env["NEXT_PUBLIC_APP_URL"] ?? new URL(request.url).origin
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const baseUrl = getBaseUrl(request)
  const { searchParams } = new URL(request.url)

  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    const msg = error ?? "auth_failed"
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(msg)}&provider=${provider}`
    )
  }

  // Récupère orgId + pkce_verifier depuis le cookie
  const cookieRaw = request.cookies.get("oauth_state")?.value
  let orgId = "unknown"
  let pkceVerifier: string | null = null

  if (cookieRaw) {
    try {
      const parsed = JSON.parse(cookieRaw) as { orgId?: string; pkceVerifier?: string | null }
      if (parsed.orgId) orgId = parsed.orgId
      if (parsed.pkceVerifier) pkceVerifier = parsed.pkceVerifier
    } catch { /* ignore */ }
  }

  // Fallback: state param (base64url JSON)
  if (orgId === "unknown") {
    const stateRaw = searchParams.get("state")
    if (stateRaw) {
      try {
        const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString()) as { orgId?: string }
        if (decoded.orgId) orgId = decoded.orgId
      } catch { /* ignore */ }
    }
  }

  const config = OAUTH_CONFIGS[provider]
  if (!config) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=unknown_provider&provider=${provider}`
    )
  }

  const clientId = process.env[config.clientIdEnv] ?? ""
  const clientSecret = process.env[config.clientSecretEnv] ?? ""
  const redirectUri = `${baseUrl}/api/integrations/${provider}/callback`

  try {
    // Échange le code contre les tokens
    const tokenBody = new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    })

    if (config.tokenAuthMethod === "body") {
      tokenBody.set("client_id", clientId)
      tokenBody.set("client_secret", clientSecret)
    }

    if (pkceVerifier) {
      tokenBody.set("code_verifier", pkceVerifier)
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    }

    if (config.tokenAuthMethod === "basic") {
      headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers,
      body: tokenBody.toString(),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      throw new Error(`Token exchange failed (${tokenRes.status}): ${errText.slice(0, 200)}`)
    }

    const tokens = await tokenRes.json() as Record<string, unknown>

    // Sauvegarde chiffrée en DB
    const credentials: Record<string, unknown> = {
      access_token: tokens["access_token"],
      refresh_token: tokens["refresh_token"] ?? null,
      expires_in: tokens["expires_in"] ?? null,
      token_type: tokens["token_type"] ?? "Bearer",
      scope: tokens["scope"] ?? config.scopes,
      expires_at: tokens["expires_in"]
        ? new Date(Date.now() + Number(tokens["expires_in"]) * 1000).toISOString()
        : null,
      raw: tokens,
    }

    await upsertIntegration(orgId, provider as IntegrationProvider, credentials, {
      scopes: (typeof credentials["scope"] === "string" ? credentials["scope"] : config.scopes).split(/[\s,]+/).filter(Boolean),
      connectedAt: new Date().toISOString(),
    })

    const response = NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?connected=${provider}`
    )
    // Nettoie le cookie
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" })
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token exchange error"
    logger.error("oauth-callback token exchange échoué", { provider, err: msg })
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(msg.slice(0, 100))}&provider=${provider}`
    )
  }
}

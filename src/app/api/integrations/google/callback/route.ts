export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { exchangeGoogleCode } from "@/lib/integrations/google"
import { upsertIntegration } from "@/lib/integrations/manager"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const stateRaw = searchParams.get("state")

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${process.env["NEXT_PUBLIC_APP_URL"]}/dashboard/integrations?error=google_auth_failed`)
  }

  let orgId: string
  try {
    const decoded = JSON.parse(Buffer.from(stateRaw, "base64").toString()) as { orgId: string }
    if (!decoded.orgId) throw new Error("orgId manquant dans state")
    orgId = decoded.orgId
  } catch {
    return NextResponse.redirect(`${process.env["NEXT_PUBLIC_APP_URL"]}/dashboard/integrations?error=invalid_state`)
  }

  try {
    const tokens = await exchangeGoogleCode(code)
    const tokensRecord: Record<string, unknown> = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      token_type: tokens.token_type,
      scope: tokens.scope,
    }
    await upsertIntegration(orgId, "google", tokensRecord, { scopes: tokens.scope.split(" ") })
    return NextResponse.redirect(`${process.env["NEXT_PUBLIC_APP_URL"]}/dashboard/integrations?connected=google`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.redirect(`${process.env["NEXT_PUBLIC_APP_URL"]}/dashboard/integrations?error=${encodeURIComponent(msg)}`)
  }
}

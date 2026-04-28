export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { createConnectToken } from "@/lib/integrations/pipedream"

export async function POST() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const result = await createConnectToken(orgId)
    // Retourne le format attendu par createFrontendClient tokenCallback
    return NextResponse.json({
      token: result.token,
      expiresAt: result.expires_at,
      connectLinkUrl: "",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Pipedream"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

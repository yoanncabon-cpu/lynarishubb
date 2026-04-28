import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { disconnectIntegration } from "@/lib/integrations/manager"
import type { IntegrationProvider } from "@/lib/integrations/manager"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  try {
    const orgId = await getOrProvisionOrgId()
    await disconnectIntegration(orgId, provider as IntegrationProvider)
    return NextResponse.json({ success: true, provider })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

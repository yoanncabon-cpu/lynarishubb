export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { listIntegrations } from "@/lib/integrations/manager"

export async function GET(_request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  const list = await listIntegrations(orgId)
  return NextResponse.json({ integrations: list })
}

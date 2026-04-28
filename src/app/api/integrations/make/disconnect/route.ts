export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { disconnectIntegration } from "@/lib/integrations/manager"

export async function DELETE(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  await disconnectIntegration(orgId, "make")
  return NextResponse.json({ success: true, provider: "make" })
}

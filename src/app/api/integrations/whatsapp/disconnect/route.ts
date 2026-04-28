export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { disconnectWA } from "@/lib/whatsapp/session-manager"

export async function DELETE() {
  const orgId = await getOrProvisionOrgId()
  await disconnectWA(orgId)
  return NextResponse.json({ success: true })
}

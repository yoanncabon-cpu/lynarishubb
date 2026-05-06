import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { getGoogleAuthUrl } from "@/lib/integrations/google"
import { signHmac } from "@/lib/crypto"

export async function GET(_request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  const state = await signHmac(`${orgId}:${Date.now()}`, process.env["INTEGRATIONS_ENCRYPTION_KEY"] ?? "fallback")
  const url = getGoogleAuthUrl(Buffer.from(JSON.stringify({ orgId, state })).toString("base64"))
  return NextResponse.redirect(url)
}

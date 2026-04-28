export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { upsertIntegration } from "@/lib/integrations/manager"
import { z } from "zod"

const schema = z.object({
  provider:   z.string().min(1),
  accountId:  z.string().min(1), // Pipedream account ID
})

export async function POST(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    await upsertIntegration(orgId, parsed.data.provider, {
      pipedream_account_id: parsed.data.accountId,
      connected_via: "pipedream",
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur sauvegarde"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

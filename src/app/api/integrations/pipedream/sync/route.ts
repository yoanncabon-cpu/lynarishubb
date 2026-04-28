export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { getPipedreamClient, PIPEDREAM_APP_SLUGS } from "@/lib/integrations/pipedream"
import { upsertIntegration } from "@/lib/integrations/manager"
import { z } from "zod"

const schema = z.object({
  provider: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "provider requis" }, { status: 422 })
  }

  const { provider } = parsed.data
  const appSlug = PIPEDREAM_APP_SLUGS[provider] ?? provider

  try {
    const pd = getPipedreamClient()
    // Récupère tous les comptes connectés pour cet utilisateur + cette app
    const page = await pd.accounts.list({ externalUserId: orgId, app: appSlug })
    const items: Array<{ id: string }> = []
    for await (const account of page) {
      items.push(account)
    }

    if (items.length === 0) {
      return NextResponse.json({ connected: false })
    }

    // Prend le compte le plus récent (dernier de la liste)
    const accountId = items[items.length - 1]!.id

    await upsertIntegration(orgId, provider, {
      pipedream_account_id: accountId,
      connected_via: "pipedream",
    })

    return NextResponse.json({ connected: true, accountId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur sync"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

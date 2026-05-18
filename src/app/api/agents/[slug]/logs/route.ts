import { type NextRequest, NextResponse } from "next/server"
import { getAgent } from "@/lib/agents/registry"
import { db } from "@/lib/db"
import { actionLogs, agentInstances } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { desc, eq, and } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const agent = getAgent(slug)
  if (!agent) return NextResponse.json({ error: `Agent '${slug}' not found` }, { status: 404 })

  const orgId = await getOrProvisionOrgId()

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "50"), 100)

  const rows = await db
    .select({
      id:           actionLogs.id,
      type:         actionLogs.type,
      status:       actionLogs.status,
      duration_ms:  actionLogs.durationMs,
      cost_usd:     actionLogs.costUsd,
      created_at:   actionLogs.createdAt,
    })
    .from(actionLogs)
    .innerJoin(agentInstances, eq(actionLogs.agentInstanceId, agentInstances.id))
    .where(and(eq(actionLogs.orgId, orgId), eq(agentInstances.agentSlug, slug)))
    .orderBy(desc(actionLogs.createdAt))
    .limit(limit)
    .catch(() => [])

  const total_cost_usd = rows.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)

  return NextResponse.json({
    agent: slug,
    logs: rows.map(r => ({
      id:          r.id,
      type:        r.type,
      status:      r.status ?? "success",
      duration_ms: r.duration_ms ?? undefined,
      cost_usd:    r.cost_usd ? Number(r.cost_usd) : undefined,
      created_at:  r.created_at.toISOString(),
    })),
    total: rows.length,
    total_cost_usd: Math.round(total_cost_usd * 1000) / 1000,
  })
}

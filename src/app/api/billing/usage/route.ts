import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { usageEvents } from "@/lib/db/schema"
import { eq, gte, and, sum } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const rows = await db
    .select({
      metric: usageEvents.metric,
      total: sum(usageEvents.quantity),
      cost: sum(usageEvents.costUsd),
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.orgId, orgId),
        gte(usageEvents.createdAt, startOfMonth)
      )
    )
    .groupBy(usageEvents.metric)

  return NextResponse.json({
    org_id: orgId,
    period_start: startOfMonth.toISOString(),
    usage: rows,
  })
}

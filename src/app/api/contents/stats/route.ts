export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { contents } from "@/lib/db/schema"
import { eq, and, ne, count, sql } from "drizzle-orm"

export async function GET() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const baseWhere = and(eq(contents.orgId, orgId), ne(contents.status, "archived"))

  const [totals] = await db
    .select({ total: count() })
    .from(contents)
    .where(baseWhere)

  const byAgent = await db
    .select({ agentSlug: contents.agentSlug, total: count() })
    .from(contents)
    .where(baseWhere)
    .groupBy(contents.agentSlug)

  const byType = await db
    .select({ contentType: contents.contentType, total: count() })
    .from(contents)
    .where(baseWhere)
    .groupBy(contents.contentType)

  const byPlatform = await db
    .select({ platform: contents.platform, total: count() })
    .from(contents)
    .where(and(eq(contents.orgId, orgId), ne(contents.status, "archived")))
    .groupBy(contents.platform)

  // Derniers 30 jours — activité par jour
  const daily = await db
    .select({
      day: sql<string>`date_trunc('day', ${contents.createdAt})::date::text`,
      total: count(),
    })
    .from(contents)
    .where(
      and(
        eq(contents.orgId, orgId),
        ne(contents.status, "archived"),
        sql`${contents.createdAt} >= now() - interval '30 days'`
      )
    )
    .groupBy(sql`date_trunc('day', ${contents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${contents.createdAt})`)

  return NextResponse.json({
    total: totals?.total ?? 0,
    byAgent,
    byType,
    byPlatform,
    daily,
  })
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { phoneNumbers } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logger } from "@/lib/logger"

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const numbers = await db
      .select()
      .from(phoneNumbers)
      .where(and(eq(phoneNumbers.orgId, orgId)))
      .orderBy(phoneNumbers.createdAt)

    return NextResponse.json({ numbers })
  } catch (err) {
    logger.error("phone-numbers GET échoué", { err: String(err) })
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

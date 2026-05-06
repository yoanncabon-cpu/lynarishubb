export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(_request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { settings: true },
    })
    const settings = (org?.settings ?? {}) as Record<string, unknown>
    return NextResponse.json({
      phone_credits: settings.phone_credits ?? 0,
      api_credits: settings.api_credits ?? 0,
      phone_pending: settings.phone_pending ?? 0,
      api_pending: settings.api_pending ?? 0,
      auto_recharge_phone: settings.auto_recharge_phone ?? false,
      auto_recharge_api: settings.auto_recharge_api ?? false,
      auto_recharge_phone_amount: settings.auto_recharge_phone_amount ?? 25,
      auto_recharge_api_amount: settings.auto_recharge_api_amount ?? 25,
      auto_recharge_threshold: settings.auto_recharge_threshold ?? 5,
    })
  } catch {
    // DB not available â€” return defaults
    return NextResponse.json({
      phone_credits: 0,
      api_credits: 0,
      phone_pending: 0,
      api_pending: 0,
      auto_recharge_phone: false,
      auto_recharge_api: false,
      auto_recharge_phone_amount: 25,
      auto_recharge_api_amount: 25,
      auto_recharge_threshold: 5,
    })
  }
}

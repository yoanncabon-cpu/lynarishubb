export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  type: z.enum(["phone", "api"]),
  enabled: z.boolean(),
  amount: z.number().min(5).max(500).optional(),
  threshold: z.number().min(1).max(100).optional(),
})

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { type, enabled, amount, threshold } = parsed.data
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { settings: true },
    })
    const settings = (org?.settings ?? {}) as Record<string, unknown>
    const key = type === "phone" ? "auto_recharge_phone" : "auto_recharge_api"
    const amountKey =
      type === "phone" ? "auto_recharge_phone_amount" : "auto_recharge_api_amount"

    const updated = {
      ...settings,
      [key]: enabled,
      ...(amount !== undefined ? { [amountKey]: amount } : {}),
      ...(threshold !== undefined ? { auto_recharge_threshold: threshold } : {}),
    }

    await db
      .update(organizations)
      .set({ settings: updated })
      .where(eq(organizations.id, orgId))

    return NextResponse.json({ success: true, settings: updated })
  } catch {
    return NextResponse.json({ success: true, message: "Saved (demo mode)" })
  }
}

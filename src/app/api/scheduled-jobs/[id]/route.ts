export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { scheduledJobs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { computeNextRunAt } from "@/lib/scheduler"
import type { Frequency } from "@/lib/scheduler"

// Zod v4 a un bug avec .nullable().optional() ET .nullish() sur les champs
// avec contraintes (min/max/int). Workaround : preprocess null → undefined
// avant que la validation number ne s'applique.
const nullableNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === null ? undefined : v),
    z.number().int().min(min).max(max).optional()
  )

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  instruction: z.string().min(1).max(2000).optional(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  dayOfWeek: nullableNumber(0, 6),
  dayOfMonth: nullableNumber(1, 31),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    console.error("[scheduled-jobs PATCH] Validation Zod échouée", { body, issues: parsed.error.issues })
    return NextResponse.json({
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")} : ${i.message}`)
        .join(" | "),
    }, { status: 422 })
  }

  const [existing] = await db
    .select()
    .from(scheduledJobs)
    .where(and(eq(scheduledJobs.id, id), eq(scheduledJobs.orgId, orgId)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const updates: Partial<typeof scheduledJobs.$inferInsert> = { ...parsed.data }

  // Recalcule next_run_at si l'heure change
  if (parsed.data.hour !== undefined || parsed.data.minute !== undefined || parsed.data.frequency !== undefined) {
    updates.nextRunAt = computeNextRunAt({
      frequency: (parsed.data.frequency ?? existing.frequency) as Frequency,
      hour: parsed.data.hour ?? existing.hour,
      minute: parsed.data.minute ?? existing.minute,
      dayOfWeek: parsed.data.dayOfWeek ?? existing.dayOfWeek,
      dayOfMonth: parsed.data.dayOfMonth ?? existing.dayOfMonth,
      timezone: existing.timezone,
    })
  }

  const [updated] = await db
    .update(scheduledJobs)
    .set(updates)
    .where(and(eq(scheduledJobs.id, id), eq(scheduledJobs.orgId, orgId)))
    .returning()

  return NextResponse.json({ job: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  await db
    .delete(scheduledJobs)
    .where(and(eq(scheduledJobs.id, id), eq(scheduledJobs.orgId, orgId)))

  return NextResponse.json({ ok: true })
}

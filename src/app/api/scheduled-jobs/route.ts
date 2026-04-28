export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { scheduledJobs } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { computeNextRunAt } from "@/lib/scheduler"
import type { Frequency } from "@/lib/scheduler"

// Zod v4 : preprocess null → undefined pour les champs avec contraintes nombre.
// Sinon "Invalid input: expected number, received null" quand le client envoie null
// pour les jours non pertinents (ex: dayOfWeek: null quand frequency = "daily").
const nullableNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === null ? undefined : v),
    z.number().int().min(min).max(max).optional()
  )

const createSchema = z.object({
  agentSlug:   z.string().min(1),
  name:        z.string().min(1).max(100),
  instruction: z.string().min(1).max(2000),
  frequency:   z.enum(["daily", "weekly", "monthly"]),
  hour:        z.number().int().min(0).max(23),
  minute:      z.number().int().min(0).max(59).default(0),
  dayOfWeek:   nullableNumber(0, 6),
  dayOfMonth:  nullableNumber(1, 31),
  timezone:    z.string().default("Europe/Paris"),
})

export async function GET() {
  try {
    const orgId = await getOrProvisionOrgId()
    if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const jobs = await db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.orgId, orgId))
      .orderBy(desc(scheduledJobs.createdAt))

    // Self-heal : si un job actif a un nextRunAt dans le passé (cron en retard,
    // dev sans cron Vercel, etc.), recalcule la prochaine occurrence valide.
    // On met à jour la DB en best-effort pour que les autres lecteurs voient pareil.
    const now = Date.now()
    const healed = await Promise.all(jobs.map(async (job) => {
      if (!job.isActive) return job
      if (job.nextRunAt && new Date(job.nextRunAt).getTime() > now) return job

      const fresh = computeNextRunAt({
        frequency: job.frequency as Frequency,
        hour: job.hour,
        minute: job.minute,
        dayOfWeek: job.dayOfWeek,
        dayOfMonth: job.dayOfMonth,
        timezone: job.timezone,
      })
      try {
        await db.update(scheduledJobs).set({ nextRunAt: fresh }).where(eq(scheduledJobs.id, job.id))
      } catch { /* best effort */ }
      return { ...job, nextRunAt: fresh }
    }))

    return NextResponse.json({ jobs: healed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[scheduled-jobs GET]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrProvisionOrgId()
    if (orgId === ANON_ORG_ID) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const body = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      console.error("[scheduled-jobs POST] Validation Zod échouée", { body, issues: parsed.error.issues })
      return NextResponse.json({
        error: parsed.error.issues
          .map((i) => `${i.path.join(".")} : ${i.message}`)
          .join(" | "),
      }, { status: 422 })
    }

    const d = parsed.data
    const nextRunAt = computeNextRunAt({
      frequency: d.frequency as Frequency,
      hour: d.hour,
      minute: d.minute,
      dayOfWeek: d.dayOfWeek,
      dayOfMonth: d.dayOfMonth,
      timezone: d.timezone,
    })

    const [job] = await db.insert(scheduledJobs).values({
      orgId,
      agentSlug:   d.agentSlug,
      name:        d.name,
      instruction: d.instruction,
      frequency:   d.frequency,
      hour:        d.hour,
      minute:      d.minute,
      dayOfWeek:   d.dayOfWeek ?? null,
      dayOfMonth:  d.dayOfMonth ?? null,
      timezone:    d.timezone,
      nextRunAt,
    }).returning()

    return NextResponse.json({ job }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[scheduled-jobs POST]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

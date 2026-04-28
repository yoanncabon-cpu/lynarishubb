export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 120

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledJobs, agentInstances, actionLogs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { runAgent } from "@/lib/agents/executor"
import { computeNextRunAt } from "@/lib/scheduler"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env["CRON_SECRET"]) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const [job] = await db
    .select()
    .from(scheduledJobs)
    .where(eq(scheduledJobs.id, id))
    .limit(1)

  if (!job) return NextResponse.json({ error: "Job introuvable" }, { status: 404 })
  if (!job.isActive) return NextResponse.json({ error: "Job inactif" }, { status: 400 })

  const startedAt = new Date()

  // Marque comme démarré + calcule le prochain run immédiatement
  const nextRun = computeNextRunAt({
    frequency: job.frequency as "daily" | "weekly" | "monthly",
    hour: job.hour,
    minute: job.minute,
    dayOfWeek: job.dayOfWeek,
    dayOfMonth: job.dayOfMonth,
    timezone: job.timezone,
  })

  await db
    .update(scheduledJobs)
    .set({ lastRunAt: startedAt, nextRunAt: nextRun })
    .where(eq(scheduledJobs.id, id))

  let result = ""
  let success = false

  try {
    // Upsert agent instance
    const [instance] = await db
      .insert(agentInstances)
      .values({ orgId: job.orgId, agentSlug: job.agentSlug, isActive: true })
      .onConflictDoUpdate({
        target: [agentInstances.orgId, agentInstances.agentSlug],
        set: { isActive: true },
      })
      .returning({ id: agentInstances.id })

    // Exécute l'agent
    const run = await runAgent({
      agentSlug: job.agentSlug,
      messages: [{ role: "user", content: job.instruction }],
      orgId: job.orgId,
      maxIterations: 8,
    })

    result = run.content.slice(0, 2000)
    success = true

    // Log dans action_logs
    await db.insert(actionLogs).values({
      orgId: job.orgId,
      agentInstanceId: instance?.id ?? null,
      type: "scheduled_job",
      status: "success",
      durationMs: Date.now() - startedAt.getTime(),
      payload: { jobId: id, jobName: job.name, agentSlug: job.agentSlug },
    })
  } catch (err) {
    result = err instanceof Error ? err.message : "Erreur inconnue"
    success = false

    await db.insert(actionLogs).values({
      orgId: job.orgId,
      agentInstanceId: null,
      type: "scheduled_job",
      status: "error",
      errorMessage: result,
      durationMs: Date.now() - startedAt.getTime(),
      payload: { jobId: id, jobName: job.name, agentSlug: job.agentSlug },
    })
  }

  // Sauvegarde le résultat + incrémente le compteur
  await db
    .update(scheduledJobs)
    .set({
      lastResult: result,
      runCount: (job.runCount ?? 0) + 1,
    })
    .where(eq(scheduledJobs.id, id))

  return NextResponse.json({ success, result: result.slice(0, 500) })
}

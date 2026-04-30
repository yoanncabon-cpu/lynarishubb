export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 120

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledJobs, agentInstances, actionLogs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { runAgent } from "@/lib/agents/executor"
import { computeNextRunAt, type Frequency } from "@/lib/scheduler"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"

/**
 * Exécution manuelle d'un job par l'utilisateur authentifié.
 * Sert pour tester un job en dev (pas de cron Vercel local) ou déclencher
 * un run à la volée sans attendre le prochain horaire planifié.
 *
 * Diffère de /execute (qui requiert CRON_SECRET) car :
 * - Auth basée sur l'utilisateur via Supabase
 * - Vérifie que le job appartient bien à l'org de l'utilisateur
 * - Recalcule next_run_at après l'exécution (sinon l'UI affiche "imminent" en boucle)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Lecture du job + vérif appartenance org (sécurité multi-tenant)
  const [job] = await db
    .select()
    .from(scheduledJobs)
    .where(and(eq(scheduledJobs.id, id), eq(scheduledJobs.orgId, orgId)))
    .limit(1)

  if (!job) {
    return NextResponse.json({ error: "Job introuvable" }, { status: 404 })
  }

  const startedAt = new Date()

  // Marque comme démarré (lastRunAt) sans toucher à nextRunAt
  await db
    .update(scheduledJobs)
    .set({ lastRunAt: startedAt })
    .where(eq(scheduledJobs.id, id))

  let result = ""
  let success = false

  try {
    const [instance] = await db
      .insert(agentInstances)
      .values({ orgId: job.orgId, agentSlug: job.agentSlug, isActive: true })
      .onConflictDoUpdate({
        target: [agentInstances.orgId, agentInstances.agentSlug],
        set: { isActive: true },
      })
      .returning({ id: agentInstances.id })

    // Même préfixe scheduled qu'en execute : pas d'humain en face → Charles doit agir seul,
    // sans poser de question ni attendre de clarification.
    const scheduledPrefix =
      "[Exécution automatique planifiée — aucun humain n'est en face pour te répondre. " +
      "Exécute la tâche immédiatement avec les informations dont tu disposes (mémoire, calendrier, " +
      "Gmail, contacts, intégrations connectées). Ne demande JAMAIS de clarification, ne dis JAMAIS " +
      "« j'ai besoin de plus d'infos », ne pose JAMAIS de question. Si une donnée manque, fais au " +
      "mieux avec ce que tu as et indique simplement la limitation dans le résultat envoyé.]\n\n"

    const run = await runAgent({
      agentSlug: job.agentSlug,
      messages: [{ role: "user", content: scheduledPrefix + job.instruction }],
      orgId: job.orgId,
      maxIterations: 8,
      emailStyle: job.emailStyle,
    })

    result = run.content.slice(0, 2000)
    success = true

    await db.insert(actionLogs).values({
      orgId: job.orgId,
      agentInstanceId: instance?.id ?? null,
      type: "scheduled_job",
      status: "success",
      durationMs: Date.now() - startedAt.getTime(),
      payload: { jobId: id, jobName: job.name, agentSlug: job.agentSlug, manual: true },
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
      payload: { jobId: id, jobName: job.name, agentSlug: job.agentSlug, manual: true },
    })
  }

  // Recalcule la prochaine exécution prévue (sinon next_run_at reste dans le passé
  // et l'UI affiche "imminent" en boucle après un test manuel)
  const nextRunAt = computeNextRunAt({
    frequency: job.frequency as Frequency,
    hour: job.hour,
    minute: job.minute,
    dayOfWeek: job.dayOfWeek,
    dayOfMonth: job.dayOfMonth,
    timezone: job.timezone,
  })

  await db
    .update(scheduledJobs)
    .set({
      lastResult: result,
      runCount: (job.runCount ?? 0) + 1,
      nextRunAt,
    })
    .where(eq(scheduledJobs.id, id))

  return NextResponse.json({
    success,
    result: result.slice(0, 2000),
    nextRunAt: nextRunAt.toISOString(),
  })
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledJobs } from "@/lib/db/schema"
import { eq, and, lte, isNull, or } from "drizzle-orm"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  // Vérifie le secret Vercel Cron
  const authHeader = req.headers.get("authorization")
  const expectedSecret = process.env["CRON_SECRET"]

  if (!expectedSecret) {
    logger.error("cron/run-jobs CRON_SECRET non configuré")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Jobs actifs dont next_run_at est dépassé
  const due = await db
    .select()
    .from(scheduledJobs)
    .where(
      and(
        eq(scheduledJobs.isActive, true),
        or(
          isNull(scheduledJobs.nextRunAt),
          lte(scheduledJobs.nextRunAt, now)
        )
      )
    )
    .limit(20)

  if (due.length === 0) {
    return NextResponse.json({ dispatched: 0 })
  }

  // baseUrl : variable d'env > origine de la requête > localhost (dev)
  // En prod Vercel, NEXT_PUBLIC_APP_URL doit être défini ou l'origin de la requête est utilisée
  const url = new URL(req.url)
  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? url.origin
  const secret = expectedSecret

  const jobIds = due.map((job) => job.id)

  await Promise.allSettled(
    due.map((job) =>
      fetch(`${baseUrl}/api/scheduled-jobs/${job.id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": secret,
        },
      }).catch(() => {})
    )
  )

  return NextResponse.json({ dispatched: jobIds.length, jobIds })
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { organizations, integrations, scheduledJobs, actionLogs } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"

/**
 * Diagnostic complet pour comprendre pourquoi une automatisation a échoué.
 * Vérifie : carnet en DB, Twilio configuré, Gmail configuré, dernière exécution.
 */
export async function GET() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // 1. Carnet de contacts en DB
  const [org] = await db
    .select({ settings: organizations.settings })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)
  const settings = (org?.settings ?? {}) as Record<string, unknown>
  const contacts = Array.isArray(settings["contacts"]) ? settings["contacts"] as Array<{ name?: string; email?: string; phone?: string }> : []

  // 2. Twilio configuré ? (intégration ou env)
  const [twilioInteg] = await db
    .select({ credentials: integrations.credentials })
    .from(integrations)
    .where(and(eq(integrations.orgId, orgId), eq(integrations.provider, "twilio")))
    .limit(1)
  const twilioFromIntegration = !!twilioInteg?.credentials
  const twilioFromEnv = !!(process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"] && process.env["TWILIO_PHONE_NUMBER"])

  // 3. Gmail configuré ?
  const gmailFromEnv = !!(process.env["GMAIL_USER"] && process.env["GMAIL_APP_PASSWORD"])

  // 4. Dernier log d'exécution scheduled_job
  const recentLogs = await db
    .select({
      id: actionLogs.id,
      type: actionLogs.type,
      status: actionLogs.status,
      errorMessage: actionLogs.errorMessage,
      payload: actionLogs.payload,
      createdAt: actionLogs.createdAt,
    })
    .from(actionLogs)
    .where(and(eq(actionLogs.orgId, orgId), eq(actionLogs.type, "scheduled_job")))
    .orderBy(desc(actionLogs.createdAt))
    .limit(5)

  // 5. Tous les jobs avec leur lastResult
  const jobs = await db
    .select({
      id: scheduledJobs.id,
      name: scheduledJobs.name,
      agentSlug: scheduledJobs.agentSlug,
      isActive: scheduledJobs.isActive,
      lastRunAt: scheduledJobs.lastRunAt,
      lastResult: scheduledJobs.lastResult,
      runCount: scheduledJobs.runCount,
    })
    .from(scheduledJobs)
    .where(eq(scheduledJobs.orgId, orgId))

  return NextResponse.json({
    orgId,
    contacts: {
      count: contacts.length,
      hasYoann: contacts.some(c => (c.name ?? "").toLowerCase().includes("yoann") || (c.name ?? "").toLowerCase().includes("yohan") || (c.name ?? "").toLowerCase().includes("camon") || (c.name ?? "").toLowerCase().includes("cabon")),
      list: contacts.map(c => ({ name: c.name, hasEmail: !!c.email, hasPhone: !!c.phone })),
    },
    integrations: {
      twilio: {
        configured: twilioFromIntegration || twilioFromEnv,
        fromIntegrationsTable: twilioFromIntegration,
        fromEnvVars: twilioFromEnv,
        envMissing: twilioFromEnv ? [] : [
          !process.env["TWILIO_ACCOUNT_SID"] && "TWILIO_ACCOUNT_SID",
          !process.env["TWILIO_AUTH_TOKEN"] && "TWILIO_AUTH_TOKEN",
          !process.env["TWILIO_PHONE_NUMBER"] && "TWILIO_PHONE_NUMBER",
        ].filter(Boolean),
      },
      gmail: {
        configured: gmailFromEnv,
        envMissing: gmailFromEnv ? [] : ["GMAIL_USER", "GMAIL_APP_PASSWORD"].filter(k => !process.env[k]),
      },
    },
    jobs: jobs.map(j => ({
      ...j,
      lastResult: j.lastResult ? j.lastResult.slice(0, 500) : null,
    })),
    recentLogs,
  })
}

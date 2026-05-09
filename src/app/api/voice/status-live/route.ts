import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { actionLogs, agentInstances, conversations } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { and, eq, gte, desc, count, avg } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export interface MarineStatus {
  active_calls: number
  calls_today: number
  avg_duration_seconds: number
  last_call_at: string | null
  twilio_configured: boolean
  appointments_booked_today: number
}

export async function GET() {
  const twilioConfigured = !!(process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"])

  try {
    const orgId = await getOrProvisionOrgId()
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)

    // Conversations voix Marine du jour
    // Note: conversations.agentSlug n'existe pas dans le schéma — on join agentInstances
    const [callStats] = await db
      .select({
        total:    count(),
        lastCall: conversations.startedAt,
      })
      .from(conversations)
      .innerJoin(agentInstances, eq(conversations.agentInstanceId, agentInstances.id))
      .where(and(
        eq(conversations.orgId, orgId),
        eq(agentInstances.agentSlug, "marine"),
        gte(conversations.startedAt, startOfDay),
      ))
      .orderBy(desc(conversations.startedAt))
      .limit(1)
      .catch(() => [{ total: 0n, lastCall: null }])

    // RDV créés aujourd'hui via logs Marine
    const [apptStats] = await db
      .select({ total: count() })
      .from(actionLogs)
      .innerJoin(agentInstances, eq(actionLogs.agentInstanceId, agentInstances.id))
      .where(and(
        eq(actionLogs.orgId, orgId),
        eq(agentInstances.agentSlug, "marine"),
        eq(actionLogs.type, "calendar_event"),
        gte(actionLogs.createdAt, startOfDay),
      ))
      .catch(() => [{ total: 0n }])

    // Durée moyenne (durationMs dans actionLogs type call_handled)
    const [durStats] = await db
      .select({ avgMs: avg(actionLogs.durationMs) })
      .from(actionLogs)
      .innerJoin(agentInstances, eq(actionLogs.agentInstanceId, agentInstances.id))
      .where(and(
        eq(actionLogs.orgId, orgId),
        eq(agentInstances.agentSlug, "marine"),
        eq(actionLogs.type, "call_handled"),
      ))
      .catch(() => [{ avgMs: null }])

    const status: MarineStatus = {
      active_calls:               0,
      calls_today:                Number(callStats?.total ?? 0),
      avg_duration_seconds:       Math.round((Number(durStats?.avgMs ?? 0)) / 1000),
      last_call_at:               callStats?.lastCall?.toISOString() ?? null,
      twilio_configured:          twilioConfigured,
      appointments_booked_today:  Number(apptStats?.total ?? 0),
    }

    return NextResponse.json(status)
  } catch {
    // Fallback si DB indisponible
    return NextResponse.json({
      active_calls: 0, calls_today: 0, avg_duration_seconds: 0,
      last_call_at: null, twilio_configured: twilioConfigured,
      appointments_booked_today: 0,
    } satisfies MarineStatus)
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/auth/supabase-server"
import { sendEmail } from "@/lib/emails/send"
import { weeklySummaryEmail } from "@/lib/emails/notification-templates"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  // Auth cron — Bearer CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseAdminClient()

  // Récupère tous les users Supabase Auth
  // On filtre côté application ceux qui ont weekly_summary = true dans leurs métadonnées
  const { data: usersPage, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (error) {
    logger.error("cron/weekly-summary listUsers échoué", { err: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtre les users avec la préférence activée
  type NotifPrefs = { emailWeeklySummary?: boolean }
  const eligible = usersPage.users.filter((u) => {
    const prefs = u.user_metadata?.["notification_prefs"] as NotifPrefs | undefined
    return prefs?.emailWeeklySummary === true
  })

  let sent = 0
  let skipped = 0

  const results = await Promise.allSettled(
    eligible.map(async (u) => {
      if (!u.email) {
        skipped++
        return
      }

      const meta = u.user_metadata as Record<string, string> | undefined
      const userName =
        meta?.["full_name"] ??
        meta?.["name"] ??
        (meta?.["first_name"] && meta?.["last_name"]
          ? `${meta["first_name"]} ${meta["last_name"]}`
          : meta?.["first_name"] ?? u.email.split("@")[0] ?? "utilisateur")

      const result = await sendEmail({
        to: u.email,
        template: weeklySummaryEmail(userName),
        tags: ["weekly-summary"],
      })

      if (result.success) {
        sent++
      } else {
        logger.error("cron/weekly-summary envoi échoué", { email: u.email, err: String(result.error) })
      }
    })
  )

  const failed = results.filter((r) => r.status === "rejected").length

  logger.info("cron/weekly-summary terminé", { eligible: eligible.length, sent, failed, skipped })

  return NextResponse.json({
    eligible: eligible.length,
    sent,
    failed,
    skipped,
  })
}

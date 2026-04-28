import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { actionLogs, agentInstances, users } from "@/lib/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { sendEmail } from "@/lib/emails/send"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Récupère l'email de l'utilisateur authentifié
async function getUserEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* route handler */ },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email ?? null
  } catch {
    return null
  }
}

// Construit un résumé HTML du rapport hebdomadaire
function buildReportEmail(params: {
  userName: string
  weekLabel: string
  totalActions: number
  byAgent: { slug: string; name: string; count: number }[]
}): { subject: string; html: string; text: string } {
  const { userName, weekLabel, totalActions, byAgent } = params
  const top3 = byAgent.slice(0, 3)
  const firstName = userName.split(" ")[0] ?? userName

  const agentRowsHtml = top3.map((a) =>
    `<tr>
      <td style="padding:10px 0;color:#F5F5F7;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.06)">${a.name}</td>
      <td style="padding:10px 0;text-align:right;color:#A78BFA;font-weight:700;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.06)">${a.count} action${a.count > 1 ? "s" : ""}</td>
    </tr>`
  ).join("")

  const agentRowsText = top3.map((a) => `- ${a.name} : ${a.count} action(s)`).join("\n")

  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:system-ui,sans-serif;background:#0A0A0F;color:#F5F5F7;padding:40px 20px;max-width:560px;margin:0 auto">
  <div style="margin-bottom:32px">
    <p style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#7C3AED;margin:0 0 8px">Rapport hebdomadaire</p>
    <h1 style="font-size:26px;font-weight:700;margin:0 0 6px;letter-spacing:-0.02em">Bonjour, ${firstName} !</h1>
    <p style="color:#71717A;font-size:14px;margin:0">Voici l'activité de tes agents du ${weekLabel}.</p>
  </div>

  <div style="background:#14141C;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:24px;margin-bottom:24px">
    <p style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(245,245,247,0.4);margin:0 0 8px">Total cette semaine</p>
    <p style="font-size:40px;font-weight:700;color:#A78BFA;margin:0;letter-spacing:-0.03em">${totalActions}</p>
    <p style="font-size:13px;color:#71717A;margin:4px 0 0">action${totalActions > 1 ? "s" : ""} réalisée${totalActions > 1 ? "s" : ""}</p>
  </div>

  ${top3.length > 0 ? `
  <div style="background:#14141C;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:24px;margin-bottom:24px">
    <h2 style="font-size:14px;font-weight:600;color:#F5F5F7;margin:0 0 16px">Top agents actifs</h2>
    <table style="width:100%;border-collapse:collapse">
      <tbody>
        ${agentRowsHtml}
      </tbody>
    </table>
  </div>
  ` : ""}

  <a
    href="https://app.lynaris.ai/dashboard/analytics"
    style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:10px;font-size:14px"
  >
    Voir les statistiques →
  </a>

  <p style="color:#3F3F46;font-size:12px;margin-top:40px">Lynaris · contact@lynarisai.com</p>
</body>
</html>`

  const text = `Bonjour ${firstName},

Rapport hebdomadaire Lynaris — ${weekLabel}

Total cette semaine : ${totalActions} action(s)

Top agents actifs :
${agentRowsText}

Voir les statistiques : https://app.lynaris.ai/dashboard/analytics

L'équipe Lynaris`

  const subject = `Rapport hebdomadaire Lynaris — ${weekLabel}`

  return { subject, html, text }
}

export async function POST(_request: NextRequest): Promise<NextResponse> {
  const orgId = await getOrProvisionOrgId()

  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const userEmail = await getUserEmail()
  if (!userEmail) {
    return NextResponse.json({ error: "Email utilisateur introuvable" }, { status: 400 })
  }

  // Récupère le nom de l'utilisateur depuis la table users
  const userRow = await db.query.users.findFirst({
    where: eq(users.orgId, orgId),
    columns: { fullName: true, email: true },
  })
  const userName = userRow?.fullName ?? userRow?.email ?? userEmail

  // Logs des 7 derniers jours
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const rows = await db
    .select({
      agentSlug: agentInstances.agentSlug,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(actionLogs)
    .leftJoin(agentInstances, eq(actionLogs.agentInstanceId, agentInstances.id))
    .where(
      sql`${actionLogs.orgId} = ${orgId} and ${actionLogs.createdAt} >= ${since}`
    )
    .groupBy(agentInstances.agentSlug)
    .orderBy(desc(sql`count(*)`))

  const totalActions = rows.reduce((sum, r) => sum + r.count, 0)

  const byAgent = rows.map((r) => {
    const slug = r.agentSlug ?? "lynaris"
    return {
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      count: r.count,
    }
  })

  // Labels de la semaine
  const weekStart = since.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
  const weekEnd = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
  const weekLabel = `${weekStart} – ${weekEnd}`

  const template = buildReportEmail({ userName, weekLabel, totalActions, byAgent })

  const result = await sendEmail({
    to: userEmail,
    from: `Lynaris Reports <${process.env["GMAIL_USER"] ?? "support@lynarisai.com"}>`,
    template,
    tags: ["weekly-report"],
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Envoi échoué" }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: result.id })
}

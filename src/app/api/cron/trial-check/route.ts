import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { organizations, users } from "@/lib/db/schema"
import { eq, lte, gte, and } from "drizzle-orm"
import { sendEmail } from "@/lib/emails/send"
import { trialEnding } from "@/lib/emails/stripe-templates"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const expiringOrgs = await db.query.organizations.findMany({
    where: and(
      eq(organizations.plan, "trial"),
      lte(organizations.trialEndsAt, in48h),
      gte(organizations.trialEndsAt, now)
    ),
    limit: 50,
  })

  const appUrl =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynarisai.com"

  const results = await Promise.allSettled(
    expiringOrgs.map(async (org) => {
      const trialEnd = org.trialEndsAt
      if (!trialEnd) return org.id

      const daysLeft = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Récupère l'email du propriétaire de l'org
      const owner = await db.query.users.findFirst({
        where: and(eq(users.orgId, org.id), eq(users.role, "owner")),
        columns: { email: true, fullName: true },
      })

      if (!owner?.email) {
        console.warn(`[trial-check] Pas d'owner trouvé pour org ${org.id}`)
        return org.id
      }

      const trialEndLabel = `dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}, le ${trialEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
      await sendEmail({
        to: owner.email,
        template: trialEnding({
          customerEmail: owner.email,
          customerName: owner.fullName ?? org.name,
          trialEndDate: trialEndLabel,
          upgradeUrl: `${appUrl}/dashboard/billing`,
        }),
        tags: ["trial-ending"],
      })
      return org.id
    })
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  return NextResponse.json({
    checked: expiringOrgs.length,
    emails_sent: succeeded,
  })
}

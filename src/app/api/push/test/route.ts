export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pushSubscriptions } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { eq } from "drizzle-orm"
import webpush from "web-push"

function getVapidConfig() {
  const pub  = process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"]
  const priv = process.env["VAPID_PRIVATE_KEY"]
  const subj = process.env["VAPID_SUBJECT"] ?? "mailto:support@lynarisai.com"
  if (!pub || !priv) return null
  return { pub, priv, subj }
}

export async function POST(): Promise<NextResponse> {
  const vapid = getVapidConfig()
  if (!vapid) {
    return NextResponse.json(
      { error: "VAPID non configuré — lance : node scripts/generate-vapid.mjs" },
      { status: 503 }
    )
  }

  webpush.setVapidDetails(vapid.subj, vapid.pub, vapid.priv)

  const orgId = await getOrProvisionOrgId()
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.orgId, orgId))

  if (!subs.length) {
    return NextResponse.json({ error: "Aucun appareil abonné — active les notifications d'abord" }, { status: 400 })
  }

  const payload = JSON.stringify({
    title: "Lynaris 🔔",
    body:  "Test notification — tes appareils reçoivent bien les alertes !",
    icon:  "/favicon.ico",
    url:   "/dashboard/settings",
  })

  const results = await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  )

  const sent   = results.filter(r => r.status === "fulfilled").length
  const failed = results.filter(r => r.status === "rejected").length

  // Supprime les subscriptions expirées (410 Gone)
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r?.status === "rejected") {
      const err = r.reason as { statusCode?: number }
      if (err?.statusCode === 410 && subs[i]) {
        await db.delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, subs[i]!.endpoint))
          .catch(() => {})
      }
    }
  }

  return NextResponse.json({ sent, failed, total: subs.length })
}

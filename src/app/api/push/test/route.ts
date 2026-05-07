export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pushSubscriptions } from "@/lib/db/schema"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { eq } from "drizzle-orm"

// Interface manuelle — évite toute dépendance au type web-push au build
interface WebPushLib {
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  sendNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string | Buffer
  ): Promise<{ statusCode: number }>
}

function getVapidConfig() {
  const pub  = process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"]
  const priv = process.env["VAPID_PRIVATE_KEY"]
  const subj = process.env["VAPID_SUBJECT"] ?? "mailto:support@lynarisai.com"
  if (!pub || !priv) return null
  return { pub, priv, subj }
}

function loadWebPush(): WebPushLib | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("web-push") as WebPushLib
  } catch {
    return null
  }
}

export async function POST(): Promise<NextResponse> {
  const vapid = getVapidConfig()
  if (!vapid) {
    return NextResponse.json(
      { error: "VAPID non configuré — lance : node scripts/generate-vapid.mjs puis ajoute les clés dans .env" },
      { status: 503 }
    )
  }

  const webpush = loadWebPush()
  if (!webpush) {
    return NextResponse.json(
      { error: "Package web-push manquant — lance : pnpm add web-push" },
      { status: 503 }
    )
  }

  webpush.setVapidDetails(vapid.subj, vapid.pub, vapid.priv)

  const orgId = await getOrProvisionOrgId()
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.orgId, orgId))

  if (!subs.length) {
    return NextResponse.json(
      { error: "Aucun appareil abonné — active les notifications dans Settings d'abord" },
      { status: 400 }
    )
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

  // Purge subscriptions expirées (410 Gone)
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

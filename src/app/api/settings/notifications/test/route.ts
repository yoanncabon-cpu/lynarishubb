import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { sendEmail } from "@/lib/emails/send"
import {
  weeklySummaryEmail,
  agentErrorAlertEmail,
  newFeaturesEmail,
  usageTipsEmail,
} from "@/lib/emails/notification-templates"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const bodySchema = z.object({
  type: z.enum(["weekly_summary", "agent_error", "new_features", "usage_tips"]),
})

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError ?? !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const email = user.email
  if (!email) {
    return NextResponse.json({ error: "Aucun email associé au compte" }, { status: 422 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { type } = parsed.data

  // Récupère le prénom depuis les metadata Supabase
  const meta = user.user_metadata as Record<string, string> | undefined
  const userName =
    meta?.["full_name"] ??
    meta?.["name"] ??
    (meta?.["first_name"] && meta?.["last_name"]
      ? `${meta["first_name"]} ${meta["last_name"]}`
      : meta?.["first_name"] ?? email.split("@")[0] ?? "utilisateur")

  const template = (() => {
    switch (type) {
      case "weekly_summary":
        return weeklySummaryEmail(userName)
      case "agent_error":
        return agentErrorAlertEmail("Marine", "WebSocket connection timeout après 30s — Twilio stream interrompu")
      case "new_features":
        return newFeaturesEmail(
          "Mémoire long-terme pour Charles",
          "Charles se souvient maintenant de tes préférences et du contexte de tes conversations passées. Plus besoin de répéter tes instructions d'une session à l'autre."
        )
      case "usage_tips":
        return usageTipsEmail(
          "Optimise Marine avec des instructions précises",
          "Plus les instructions de Marine sont précises (horaires exacts, durée des séances, conditions d'urgence), plus elle gère les appels de façon autonome. Pense à renseigner les créneaux de surcharge et les cas d'escalade."
        )
    }
  })()

  const result = await sendEmail({ to: email, template })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Échec de l'envoi" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, sentTo: email })
}

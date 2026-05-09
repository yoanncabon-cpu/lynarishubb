import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/auth/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  language: z.enum(["fr", "en"]).optional(),
  avatarUrl: z.string().nullable().optional(),
})

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const meta = (user.user_metadata ?? {}) as Record<string, string | null | undefined>

  // Lire le phone depuis la table users si disponible
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { fullName: true },
  })

  const fullName = (meta["full_name"] as string | undefined) ?? userRow?.fullName ?? ""
  const nameParts = fullName.split(" ")
  const firstName = (meta["first_name"] as string | undefined) ?? nameParts[0] ?? ""
  const lastName = (meta["last_name"] as string | undefined) ?? nameParts.slice(1).join(" ") ?? ""

  return NextResponse.json({
    profile: {
      firstName,
      lastName,
      email: user.email ?? "",
      phone: (meta["phone"] as string | undefined) ?? "",
      timezone: (meta["timezone"] as string | undefined) ?? "Europe/Paris",
      language: (meta["language"] as "fr" | "en" | undefined) ?? "fr",
      avatarUrl: (meta["avatar_url"] as string | undefined) ?? (meta["picture"] as string | undefined) ?? null,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { email, firstName, lastName, timezone, language, avatarUrl, phone } = parsed.data

  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Construire les user_metadata à mettre à jour
  const currentMeta = (user.user_metadata ?? {}) as Record<string, string | null>
  const newMeta: Record<string, string | null> = { ...currentMeta }

  if (firstName !== undefined) newMeta["first_name"] = firstName
  if (lastName !== undefined) newMeta["last_name"] = lastName
  if (firstName !== undefined || lastName !== undefined) {
    const fn = firstName ?? (currentMeta["first_name"] as string | undefined) ?? ""
    const ln = lastName ?? (currentMeta["last_name"] as string | undefined) ?? ""
    newMeta["full_name"] = `${fn} ${ln}`.trim()
  }
  if (timezone !== undefined) newMeta["timezone"] = timezone
  if (language !== undefined) newMeta["language"] = language
  if (avatarUrl !== undefined) newMeta["avatar_url"] = avatarUrl
  if (phone !== undefined) newMeta["phone"] = phone

  const updatePayload: { user_metadata: Record<string, string | null>; email?: string } = {
    user_metadata: newMeta,
  }

  // Mise à jour email uniquement si changement
  if (email !== undefined && email !== user.email) {
    updatePayload.email = email
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, updatePayload)

  if (error) {
    logger.error("[settings/profile] updateUserById failed", { err: error.message, userId: user.id })
    return NextResponse.json({ error: "Erreur lors de la mise à jour du profil" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

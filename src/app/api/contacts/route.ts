export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrProvisionOrgId, ANON_ORG_ID } from "@/lib/auth/get-org-id"

/**
 * Carnet d'adresses utilisateur — persisté dans organizations.settings.contacts
 *
 * GET   → liste des contacts de l'org
 * PUT   → remplace toute la liste (sync depuis le client)
 *
 * Stockage en JSONB pour éviter une migration DB. Les contacts deviennent
 * accessibles côté serveur (cron jobs, agents executor) en plus du localStorage client.
 */

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  category?: string
  primaryAgent?: string | null
  notes?: string
  createdAt?: string
  color?: string
}

export async function GET() {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ contacts: [] })
  }

  const [org] = await db
    .select({ settings: organizations.settings })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  const settings = (org?.settings ?? {}) as Record<string, unknown>
  const contacts = Array.isArray(settings["contacts"]) ? settings["contacts"] as Contact[] : []

  return NextResponse.json({ contacts })
}

export async function PUT(req: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  if (orgId === ANON_ORG_ID) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as { contacts?: unknown } | null
  if (!body || !Array.isArray(body.contacts)) {
    return NextResponse.json({ error: "Payload invalide — { contacts: [] } attendu" }, { status: 422 })
  }

  // Limite de sécurité : 500 contacts max par org
  if (body.contacts.length > 500) {
    return NextResponse.json({ error: "Trop de contacts (max 500)" }, { status: 413 })
  }

  // Récupère settings actuels pour merge (ne pas écraser d'autres clés)
  const [existing] = await db
    .select({ settings: organizations.settings })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  const currentSettings = (existing?.settings ?? {}) as Record<string, unknown>
  const newSettings = { ...currentSettings, contacts: body.contacts }

  await db
    .update(organizations)
    .set({ settings: newSettings })
    .where(eq(organizations.id, orgId))

  return NextResponse.json({ ok: true, count: body.contacts.length })
}

import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().optional(),
  sector: z.string().optional(),
  size: z.string().optional(),
  phone: z.string().optional(),
  vat: z.string().optional(),
  street: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export async function GET() {
  const orgId = await getOrProvisionOrgId()

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { name: true, settings: true },
  })

  if (!org) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 })
  }

  return NextResponse.json(
    { org },
    { headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=600" } }
  )
}

export async function PATCH(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()

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

  const { name, ...settingsFields } = parsed.data

  // Récupérer les settings actuels pour merge partiel
  const current = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { settings: true },
  })

  const currentSettings = (current?.settings ?? {}) as Record<string, string>
  const updatedSettings: Record<string, string> = { ...currentSettings }

  for (const [key, value] of Object.entries(settingsFields)) {
    if (value !== undefined) {
      updatedSettings[key] = value as string
    }
  }

  const updateValues: { settings: Record<string, string>; name?: string } = {
    settings: updatedSettings,
  }
  if (name !== undefined) {
    updateValues.name = name
  }

  const [updated] = await db
    .update(organizations)
    .set(updateValues)
    .where(eq(organizations.id, orgId))
    .returning({ name: organizations.name, settings: organizations.settings })

  return NextResponse.json({ org: updated })
}

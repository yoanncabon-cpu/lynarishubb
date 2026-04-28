import { type NextRequest, NextResponse } from "next/server"
import { getOrProvisionOrgId } from "@/lib/auth/get-org-id"
import { db } from "@/lib/db"
import { prospects } from "@/lib/db/schema"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []
  const headers = (lines[0] ?? "")
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase())
  return lines.slice(1).map((line) => {
    const values = line
      .split(",")
      .map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ""
    })
    return row
  })
}

export async function POST(request: NextRequest) {
  const orgId = await getOrProvisionOrgId()
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (!file.name.endsWith(".csv"))
    return NextResponse.json(
      { error: "File must be CSV" },
      { status: 400 }
    )

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0)
    return NextResponse.json(
      { error: "Empty or invalid CSV" },
      { status: 400 }
    )
  if (rows.length > 500)
    return NextResponse.json(
      { error: "Max 500 prospects per import" },
      { status: 400 }
    )

  const inserted = await db
    .insert(prospects)
    .values(
      rows.map((r) => ({
        orgId,
        fullName: r["full_name"] ?? r["name"] ?? r["nom"] ?? "",
        email: r["email"] ?? undefined,
        company: r["company"] ?? r["entreprise"] ?? undefined,
        headline: r["headline"] ?? r["poste"] ?? undefined,
        linkedinUrl: r["linkedin_url"] ?? r["linkedin"] ?? undefined,
        status: "new" as const,
        score: 0,
      }))
    )
    .returning({ id: prospects.id })

  return NextResponse.json({ imported: inserted.length, total: rows.length })
}

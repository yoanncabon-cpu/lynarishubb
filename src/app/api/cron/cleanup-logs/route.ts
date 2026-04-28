import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { actionLogs } from "@/lib/db/schema"
import { lte } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const deletedLogs = await db
    .delete(actionLogs)
    .where(lte(actionLogs.createdAt, cutoff))
    .returning({ id: actionLogs.id })

  return NextResponse.json({
    deleted_logs: deletedLogs.length,
    cutoff: cutoff.toISOString(),
  })
}

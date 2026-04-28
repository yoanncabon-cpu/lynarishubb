import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const isProd = process.env["NODE_ENV"] === "production"
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    domain: request.headers.get("host"),
    // En prod : pas de détails techniques
    ...(isProd ? {} : {
      env: process.env["NODE_ENV"],
      version: process.env["npm_package_version"],
    }),
  })
}

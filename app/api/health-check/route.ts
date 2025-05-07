import { NextResponse } from "next/server"
import { getEnvironment } from "@/lib/env-utils"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: getEnvironment(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  })
}

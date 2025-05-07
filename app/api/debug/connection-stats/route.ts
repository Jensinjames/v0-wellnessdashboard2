import { NextResponse } from "next/server"
import { isProduction } from "@/lib/env-utils"

export async function GET() {
  // Don't expose connection stats in production
  if (isProduction()) {
    return NextResponse.json({ error: "Connection stats are not available in production" }, { status: 403 })
  }

  // Mock connection stats for demonstration
  const connectionStats = {
    activeConnections: 5,
    poolSize: 10,
    idleConnections: 5,
    waitingClients: 0,
    maxConnections: 20,
    connectionTimeouts: 0,
    lastError: null,
    uptime: 3600, // seconds
  }

  return NextResponse.json(connectionStats)
}

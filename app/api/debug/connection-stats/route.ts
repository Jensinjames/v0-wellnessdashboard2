import { NextResponse } from "next/server"
import connectionPool from "@/lib/connection-pool"

export async function GET() {
  try {
    // Get stats without initializing connections
    const poolStats = connectionPool.getStats()

    return NextResponse.json({
      poolStats,
      timestamp: Date.now(),
    })
  } catch (error: any) {
    console.error("Error fetching connection stats:", error)
    return NextResponse.json({ error: `Error fetching connection stats: ${error.message}` }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getConnectionPoolStats } from "@/lib/supabase-server-optimized"

export async function GET() {
  try {
    const poolStats = await getConnectionPoolStats()

    return NextResponse.json({
      poolStats,
      timestamp: Date.now(),
    })
  } catch (error: any) {
    console.error("Error fetching connection stats:", error)
    return NextResponse.json({ error: `Error fetching connection stats: ${error.message}` }, { status: 500 })
  }
}

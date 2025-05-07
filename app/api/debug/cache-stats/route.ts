import { NextResponse } from "next/server"
import { getCacheStats } from "@/lib/api-cache"
import { getDeduplicationStats } from "@/lib/request-deduplication"

export async function GET() {
  try {
    // Only available in development mode
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Only available in development mode" }, { status: 403 })
    }

    const cacheStats = getCacheStats()
    const deduplicationStats = getDeduplicationStats()

    return NextResponse.json({
      cacheStats,
      deduplicationStats,
      timestamp: Date.now(),
    })
  } catch (error: any) {
    console.error("Error fetching cache stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

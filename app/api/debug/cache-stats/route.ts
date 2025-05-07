import { NextResponse } from "next/server"
import { getCacheStats } from "@/lib/api-cache"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Get cache statistics
    const cacheStats = getCacheStats()

    // Get connection pool statistics
    let connectionStats = { status: "unavailable" }

    try {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.from("health_check").select("count").limit(1)

      connectionStats = {
        status: error ? "error" : "connected",
        queryResult: data ? "success" : "empty",
        error: error ? error.message : null,
      }
    } catch (error) {
      connectionStats = {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // Return combined stats
    return NextResponse.json({
      cache: cacheStats,
      connection: connectionStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting debug stats:", error)
    return NextResponse.json({ error: "Failed to get debug statistics" }, { status: 500 })
  }
}

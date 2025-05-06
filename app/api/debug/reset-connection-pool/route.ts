import { NextResponse } from "next/server"
import { resetConnectionPool } from "@/lib/supabase-server-optimized"

export async function POST() {
  try {
    await resetConnectionPool()

    return NextResponse.json({
      success: true,
      message: "Connection pool reset successfully",
      timestamp: Date.now(),
    })
  } catch (error: any) {
    console.error("Error resetting connection pool:", error)
    return NextResponse.json({ error: `Error resetting connection pool: ${error.message}` }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { requestCoordinator } from "@/lib/request-coordinator"

export async function GET() {
  try {
    // Check Supabase connection
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.from("profiles").select("count").limit(1)

    // Get request coordinator stats
    const coordinatorStats = requestCoordinator.getStats()

    if (error) {
      console.error("Health check failed:", error)
      return NextResponse.json(
        {
          status: "error",
          database: "unavailable",
          error: error.message,
          coordinatorStats,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      coordinatorStats,
    })
  } catch (error: any) {
    console.error("Health check exception:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

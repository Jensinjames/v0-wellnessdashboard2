import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { withApiCache } from "@/lib/api-cache"
import { deduplicateRequest } from "@/lib/request-deduplication"
import { optimizeResponse } from "@/lib/response-optimization"
import { withPooledConnection } from "@/lib/connection-pool-enhanced"
import { CACHE_EXPIRY } from "@/lib/cache-utils"

export async function GET(request: Request) {
  return withApiCache(
    request,
    async () => {
      try {
        // Get the current user session
        const supabase = createRouteHandlerClient({ cookies })
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const userId = session.user.id
        const url = new URL(request.url)
        const timeframe = url.searchParams.get("timeframe") || "week"

        // Use request deduplication to prevent duplicate requests
        return deduplicateRequest(
          `dashboard:${userId}:${timeframe}`,
          async () => {
            // Use the connection pool for better performance
            const dashboardData = await withPooledConnection(async (client) => {
              // Fetch categories
              const { data: categories, error: categoriesError } = await client
                .from("categories")
                .select("*")
                .eq("user_id", userId)

              if (categoriesError) {
                console.error("Error fetching categories:", categoriesError)
                throw categoriesError
              }

              // Fetch goals
              const { data: goals, error: goalsError } = await client.from("goals").select("*").eq("user_id", userId)

              if (goalsError) {
                console.error("Error fetching goals:", goalsError)
                throw goalsError
              }

              // Fetch recent entries based on timeframe
              let startDate
              const now = new Date()

              switch (timeframe) {
                case "day":
                  startDate = new Date(now)
                  startDate.setHours(0, 0, 0, 0)
                  break
                case "week":
                  startDate = new Date(now)
                  startDate.setDate(now.getDate() - 7)
                  break
                case "month":
                  startDate = new Date(now)
                  startDate.setMonth(now.getMonth() - 1)
                  break
                default:
                  startDate = new Date(now)
                  startDate.setDate(now.getDate() - 7)
              }

              const { data: entries, error: entriesError } = await client
                .from("entries")
                .select("*")
                .eq("user_id", userId)
                .gte("created_at", startDate.toISOString())
                .order("created_at", { ascending: false })

              if (entriesError) {
                console.error("Error fetching entries:", entriesError)
                throw entriesError
              }

              return {
                categories: categories || [],
                goals: goals || [],
                entries: entries || [],
                timeframe,
              }
            })

            // Optimize the response
            return optimizeResponse(NextResponse.json(dashboardData), {
              maxAge: CACHE_EXPIRY.SHORT,
              compress: true,
            })
          },
          { debug: process.env.NODE_ENV === "development" },
        )
      } catch (error: any) {
        console.error("Error in dashboard data API route:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    },
    null,
  )
}

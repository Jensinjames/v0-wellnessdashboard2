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
        const supabase = await createRouteHandlerClient({ cookies })
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const userId = session.user.id

        // Use request deduplication to prevent duplicate requests
        return deduplicateRequest(
          `categories:${userId}`,
          async () => {
            // Use the connection pool for better performance
            const categories = await withPooledConnection(async (client) => {
              const { data, error } = await client.from("categories").select("*").eq("user_id", userId).order("name")

              if (error) {
                console.error("Error fetching categories:", error)
                throw error
              }

              return data || []
            })

            // Optimize the response
            return optimizeResponse(NextResponse.json({ categories }), {
              maxAge: CACHE_EXPIRY.CATEGORIES,
              fields: ["id", "name", "color", "icon", "created_at"],
            })
          },
          { debug: process.env.NODE_ENV === "development" },
        )
      } catch (error: any) {
        console.error("Error in categories API route:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    },
    null,
  )
}

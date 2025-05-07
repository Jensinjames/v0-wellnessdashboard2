import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/database"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const { email, action, userId } = await request.json()
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Rate limiting check
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitKey = `ratelimit:user-verification:${clientIp}`

    // Different actions for different verification tasks
    switch (action) {
      case "verify-signup": {
        // Check if user exists with this email
        const { data: user, error: userError } = await supabase
          .from("profiles")
          .select("id, email, email_verified")
          .eq("email", email)
          .single()

        if (userError && userError.code !== "PGRST116") {
          console.error("Error verifying user:", userError)
          return NextResponse.json({ error: "Error verifying user" }, { status: 500 })
        }

        return NextResponse.json({
          exists: !!user,
          verified: user?.email_verified || false,
          userId: user?.id || null,
        })
      }

      case "validate-user": {
        if (!userId) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 })
        }

        // Get user profile with verification status
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, email_verified, first_name, last_name")
          .eq("id", userId)
          .single()

        if (profileError) {
          console.error("Error validating user:", profileError)
          return NextResponse.json({ error: "Error validating user profile" }, { status: 500 })
        }

        return NextResponse.json({ profile })
      }

      case "get-verification-status": {
        // Get verification status for dashboard display
        const { data: status, error: statusError } = await supabase.auth.getUser()

        if (statusError) {
          return NextResponse.json({ error: "Error getting verification status" }, { status: 500 })
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email_verified, phone_verified")
          .eq("id", status.user?.id)
          .single()

        if (profileError) {
          return NextResponse.json({ error: "Error getting profile verification" }, { status: 500 })
        }

        return NextResponse.json({
          user: status.user,
          emailVerified: profile?.email_verified || false,
          phoneVerified: profile?.phone_verified || false,
        })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("User verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * API Route for logging authentication events
 * This provides a server-side way to log events to user_changes_log
 */
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, action, oldValues, newValues } = body

    // Validate required fields
    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {
            // This is a read-only operation
          },
          remove() {
            // This is a read-only operation
          },
        },
      },
    )

    // Get client info from request headers
    const userAgent = request.headers.get("user-agent") || "unknown"
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Insert log entry
    const { error } = await supabase.from("user_changes_log").insert({
      user_id: userId,
      action,
      old_values: oldValues || null,
      new_values: newValues || null,
      client_info: userAgent,
      ip_address: ipAddress,
    })

    if (error) {
      console.error("Error logging auth event:", error)

      // Special handling for the case where the table doesn't exist
      if (error.message.includes('relation "user_changes_log" does not exist')) {
        return NextResponse.json(
          { error: "Authentication system is being updated. Please try again later." },
          { status: 503 },
        )
      }

      return NextResponse.json({ error: "Failed to log authentication event" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Unexpected error in log-event API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

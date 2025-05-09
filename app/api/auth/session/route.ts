import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Get the current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error.message)
      return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ authenticated: false, message: "No active session" }, { status: 401 })
    }

    // Return minimal session info
    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at,
    })
  } catch (error) {
    console.error("Unexpected error in session route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

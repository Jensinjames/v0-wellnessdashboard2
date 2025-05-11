/**
 * Admin Users API
 * Secure server-side API for admin operations on users
 */
import { NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isUserAdmin } from "@/utils/auth-utils"

export async function GET(request: Request) {
  try {
    // First, verify the user is authenticated and has admin role
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const isAdmin = await isUserAdmin(session.user.id)

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Now that we've verified admin status, use the admin client for privileged operations
    const adminClient = await createAdminSupabaseClient()

    // Get users (with pagination)
    const { data, error } = await adminClient.auth.admin.listUsers()

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Return sanitized user data (don't expose sensitive information)
    const sanitizedUsers = data.users.map((user) => ({
      id: user.id,
      email: user.email,
      emailConfirmed: !!user.email_confirmed_at,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
    }))

    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

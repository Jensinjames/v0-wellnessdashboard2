/**
 * Admin User Role API
 * Secure server-side API for updating user roles
 */
import { NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isUserAdmin } from "@/utils/auth-utils"

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

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

    // Get the request body
    const body = await request.json()
    const { role } = body

    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["user", "editor", "admin"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Now that we've verified admin status, use the admin client for privileged operations
    const adminClient = await createAdminSupabaseClient()

    // Update user metadata with role
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, { user_metadata: { role } })

    if (updateError) {
      console.error("Error updating user role:", updateError)
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
    }

    // Also update the user_roles table if it exists
    try {
      await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    } catch (error) {
      console.error("Error updating user_roles table:", error)
      // Continue even if this fails, as the metadata update is the primary source of truth
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user role API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

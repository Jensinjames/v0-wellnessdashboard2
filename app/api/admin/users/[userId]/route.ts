/**
 * Admin User Delete API
 * Secure server-side API for deleting users
 */
import { NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isUserAdmin } from "@/utils/auth-utils"

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
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

    // Prevent deleting yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Now that we've verified admin status, use the admin client for privileged operations
    const adminClient = await createAdminSupabaseClient()

    // Delete the user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Error deleting user:", deleteError)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user delete API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

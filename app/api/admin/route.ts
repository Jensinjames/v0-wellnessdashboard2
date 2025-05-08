import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { isServer } from "@/utils/environment"

// This route provides secure admin operations that require service role access
// It ensures sensitive credentials are never exposed to the client

export async function POST(request: Request) {
  // Ensure this is only called server-side
  if (!isServer()) {
    return NextResponse.json({ error: "This endpoint can only be called server-side" }, { status: 403 })
  }

  try {
    // Get the request body
    const body = await request.json()
    const { operation, params } = body

    // Create a server-side Supabase client
    const supabase = createServerSupabaseClient()

    // Check if the user is authenticated and has admin privileges
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user has admin role (you should implement proper role checking)
    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single()

    const isAdmin = userRoles?.role === "admin"

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Handle different admin operations
    switch (operation) {
      case "get_users":
        // This would use the service role key on the server side
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

        if (usersError) {
          return NextResponse.json({ error: usersError.message }, { status: 500 })
        }

        return NextResponse.json({ data: users })

      case "delete_user":
        const { userId } = params

        if (!userId) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 })
        }

        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      // Add more admin operations as needed

      default:
        return NextResponse.json({ error: "Unknown operation" }, { status: 400 })
    }
  } catch (error) {
    console.error("Admin API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

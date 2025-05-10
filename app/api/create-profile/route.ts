/**
 * Create Profile API
 * Secure server-side API for creating user profiles
 */
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json()
    const { userId, email } = body as { userId: string; email: string }

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // Verify the user is authenticated
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow users to create their own profile (unless they're an admin)
    if (userId !== session.user.id) {
      // Check if the user is an admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      const isAdmin = roleData?.role === "admin"

      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden: You can only create your own profile" }, { status: 403 })
      }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (existingProfile) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 400 })
    }

    // Create the profile
    const { error: createError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (createError) {
      console.error("Error creating profile:", createError)
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Update Profile API
 * Secure server-side API for updating user profiles
 */
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { ProfileFormData } from "@/types/auth"

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json()
    const { userId, profile } = body as { userId: string; profile: ProfileFormData }

    if (!userId || !profile) {
      return NextResponse.json({ error: "User ID and profile data are required" }, { status: 400 })
    }

    // Verify the user is authenticated and is updating their own profile
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow users to update their own profile (unless they're an admin)
    if (userId !== session.user.id) {
      // Check if the user is an admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      const isAdmin = roleData?.role === "admin"

      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden: You can only update your own profile" }, { status: 403 })
      }
    }

    // Sanitize and validate the profile data
    const sanitizedProfile: Record<string, any> = {}

    // Only allow specific fields to be updated
    const allowedFields = ["first_name", "last_name", "email", "phone", "bio", "avatar_url", "preferences"]

    for (const field of allowedFields) {
      if (field in profile) {
        sanitizedProfile[field] = profile[field as keyof ProfileFormData]
      }
    }

    // Add updated_at timestamp
    sanitizedProfile.updated_at = new Date().toISOString()

    // Update the profile
    const { error: updateError } = await supabase.from("profiles").update(sanitizedProfile).eq("id", userId)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

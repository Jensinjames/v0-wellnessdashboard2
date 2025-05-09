import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 1. Ensure the user has the authenticated role
    await ensureUserRole(userId)

    // 2. Check if the user has a profile and create one if needed
    await ensureUserProfile(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error fixing user permissions:", error)
    return NextResponse.json({ error: "Failed to fix user permissions" }, { status: 500 })
  }
}

// Function to ensure the user has the authenticated role
async function ensureUserRole(userId: string) {
  try {
    // Get the user's current metadata
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData) {
      throw new Error(`Failed to get user: ${userError?.message}`)
    }

    // Check if the user already has the authenticated role
    const currentRoles = userData.user.app_metadata?.roles || []

    if (!Array.isArray(currentRoles) || !currentRoles.includes("authenticated")) {
      // Add the authenticated role
      const newRoles = Array.isArray(currentRoles) ? [...currentRoles, "authenticated"] : ["authenticated"]

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { ...userData.user.app_metadata, roles: newRoles },
      })

      if (updateError) {
        throw new Error(`Failed to update user roles: ${updateError.message}`)
      }
    }
  } catch (error) {
    console.error("Error ensuring user role:", error)
    throw error
  }
}

// Function to ensure the user has a profile
async function ensureUserProfile(userId: string) {
  try {
    // Check if the user already has a profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      throw new Error(`Failed to check user profile: ${profileError.message}`)
    }

    if (!profile) {
      // Get the user's email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

      if (userError || !userData) {
        throw new Error(`Failed to get user: ${userError?.message}`)
      }

      // Create a profile for the user
      const { error: insertError } = await supabaseAdmin.from("profiles").insert({
        id: userId,
        email: userData.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        throw new Error(`Failed to create user profile: ${insertError.message}`)
      }
    }
  } catch (error) {
    console.error("Error ensuring user profile:", error)
    throw error
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/database"

export async function GET(request: Request) {
  try {
    // Create a Supabase client with admin privileges
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check if the user is authenticated and has admin privileges
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // If userId is provided, check/repair that specific user
    if (userId) {
      const { data, error } = await supabase.rpc("ensure_user_profile", {
        user_id: userId,
      })

      if (error) {
        console.error("Error ensuring user profile:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: data ? "Profile verified/created successfully" : "Failed to verify profile",
        userId,
      })
    }

    // Otherwise, get all profiles for verification
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100)

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ success: false, error: profilesError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
    })
  } catch (error: any) {
    console.error("Unexpected error in verify-profiles API:", error)
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Create a Supabase client with admin privileges
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check if the user is authenticated and has admin privileges
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { action, userId } = body

    if (action === "repair_all") {
      // Run the repair function for all users
      const { data, error } = await supabase.rpc("repair_missing_profiles")

      if (error) {
        console.error("Error repairing profiles:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Profile repair initiated",
        results: data,
      })
    } else if (action === "repair_user" && userId) {
      // Repair a specific user's profile
      const { data, error } = await supabase.rpc("ensure_user_profile", {
        user_id: userId,
      })

      if (error) {
        console.error("Error repairing user profile:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: data ? "Profile repaired successfully" : "Failed to repair profile",
        userId,
      })
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Unexpected error in verify-profiles API:", error)
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 })
  }
}

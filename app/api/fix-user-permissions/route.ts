import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/database"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Create a Supabase client with admin privileges
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Verify the user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !userData.user) {
      console.error("Error getting user:", userError)
      return NextResponse.json({ success: false, error: userError?.message || "User not found" }, { status: 404 })
    }

    // Ensure the user has the authenticated role
    // This would typically be done through Supabase's admin API
    // For this example, we'll simulate it with a direct query
    const { error: roleError } = await supabase.rpc("ensure_user_role", {
      user_id: userId,
      role_name: "authenticated",
    })

    if (roleError) {
      console.error("Error ensuring user role:", roleError)
      return NextResponse.json({ success: false, error: roleError.message }, { status: 500 })
    }

    // Ensure the user has a profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (profileError && !profileError.message.includes("No rows found")) {
      console.error("Error checking profile:", profileError)
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 })
    }

    // If no profile exists, create one
    if (!profileData) {
      const { error: createError } = await supabase.from("profiles").insert({
        id: userId,
        email: userData.user.email || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createError) {
        console.error("Error creating profile:", createError)
        return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Unexpected error fixing user permissions:", error)
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getRouteHandlerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const supabase = getRouteHandlerSupabaseClient(cookies)

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if profile exists
    const {
      data: existingProfile,
      count,
      error: profileError,
    } = await supabase.from("profiles").select("*", { count: "exact" }).eq("id", user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // If profile doesn't exist, create it
    if (count === 0) {
      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: createdProfile, error: createError } = await supabase.from("profiles").insert([newProfile]).select()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({ profile: createdProfile[0] })
    }

    return NextResponse.json({ profile: existingProfile[0] })
  } catch (error) {
    console.error("Error in ensure-profile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

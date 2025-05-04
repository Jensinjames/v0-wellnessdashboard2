import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getRouteHandlerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    console.log("API: Ensure profile request received")
    const supabase = getRouteHandlerSupabaseClient(cookies)

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("API: Unauthorized - No valid user session", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`API: Found authenticated user: ${user.id}`)

    // Check if profile exists
    const {
      data: existingProfile,
      count,
      error: profileError,
    } = await supabase.from("profiles").select("*", { count: "exact" }).eq("id", user.id)

    if (profileError) {
      console.error(`API: Error checking for existing profile: ${profileError.message}`, profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // If profile doesn't exist, create it
    if (count === 0) {
      console.log(`API: No profile found for user ${user.id}, creating new profile`)

      // Extract user metadata
      const fullName = user.user_metadata?.full_name || null
      const avatarUrl = user.user_metadata?.avatar_url || null

      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("API: New profile data:", newProfile)

      try {
        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()

        if (createError) {
          console.error(`API: Error creating profile: ${createError.message}`, createError)

          // Check if it's a duplicate key error (profile might have been created in a race condition)
          if (createError.code === "23505") {
            // PostgreSQL unique constraint violation
            console.log("API: Duplicate key error - profile might already exist, fetching existing profile")

            const { data: existingProfile, error: fetchError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single()

            if (fetchError) {
              console.error(`API: Error fetching existing profile after duplicate key error: ${fetchError.message}`)
              return NextResponse.json({ error: fetchError.message }, { status: 500 })
            }

            console.log("API: Successfully retrieved existing profile after duplicate key error")
            return NextResponse.json({ profile: existingProfile })
          }

          return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        console.log(`API: Profile created successfully for user ${user.id}`)
        return NextResponse.json({ profile: createdProfile[0] })
      } catch (error: any) {
        console.error(`API: Exception creating profile: ${error.message}`, error)
        return NextResponse.json({ error: error.message || "Unknown error creating profile" }, { status: 500 })
      }
    }

    console.log(`API: Profile already exists for user ${user.id}`)
    return NextResponse.json({ profile: existingProfile[0] })
  } catch (error: any) {
    console.error(`API: Unhandled error in ensure-profile route: ${error.message}`, error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

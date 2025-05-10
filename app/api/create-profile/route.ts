import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function POST(request: Request) {
  try {
    // Get the request body
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create a Supabase client with the service role key
    const supabase = createServerClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookies().set(name, value, options)
        },
        remove(name: string, options: any) {
          cookies().set(name, "", { ...options, maxAge: 0 })
        },
      },
    })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required to create profile" }, { status: 401 })
    }

    // Check if a profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileCheckError && !profileCheckError.message.includes("No rows found")) {
      console.error("Error checking for existing profile:", profileCheckError)
      return NextResponse.json({ error: "Error checking for existing profile" }, { status: 500 })
    }

    // If profile already exists, return success
    if (existingProfile) {
      return NextResponse.json({ success: true, message: "Profile already exists" })
    }

    // Create a profile for the user
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error creating profile:", insertError)
      return NextResponse.json({ error: "Failed to create profile: " + insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Profile created successfully",
    })
  } catch (error) {
    console.error("Unexpected error in create-profile route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

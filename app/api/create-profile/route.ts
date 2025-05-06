import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/database"

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    console.log(`Creating profile for user ${userId} with email ${email}`)

    // Create a Supabase client with the service role key
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // First, check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking if profile exists:", fetchError)
      return NextResponse.json({ error: `Error checking if profile exists: ${fetchError.message}` }, { status: 500 })
    }

    // If profile already exists, return it
    if (existingProfile) {
      console.log("Profile already exists, returning existing profile")
      return NextResponse.json({ profile: existingProfile })
    }

    // Create minimal profile with only essential fields
    const newProfile = {
      id: userId,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Creating new profile with data:", newProfile)

    console.log("Attempting upsert with conflict handling on id column:", newProfile)

    // Use upsert with explicit conflict handling on the id column
    const { data, error } = await supabase
      .from("profiles")
      .upsert(newProfile, {
        onConflict: "id",
        ignoreDuplicates: false, // Update if exists
        returning: "representation", // Return the updated/inserted row
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)

      if (error.code === "23505") {
        // PostgreSQL unique violation code
        console.log("Conflict detected, attempting to fetch existing profile")

        // If conflict, try to fetch the existing profile
        const { data: existingData, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (!fetchError && existingData) {
          console.log("Successfully retrieved existing profile after conflict")
          return NextResponse.json({ profile: existingData })
        }
      }

      // If we get a schema error, try with just id and email
      if (error.message?.includes("column") || error.message?.includes("schema")) {
        console.log("Trying with minimal profile data (id and email only)")
        const minimalProfile = {
          id: userId,
          email: email,
        }

        const { data: minimalData, error: minimalError } = await supabase
          .from("profiles")
          .upsert(minimalProfile, {
            onConflict: "id",
            ignoreDuplicates: false,
            returning: "representation",
          })
          .select()
          .single()

        if (minimalError) {
          console.error("Error creating minimal profile:", minimalError)
          return NextResponse.json({ error: `Error creating profile: ${minimalError.message}` }, { status: 500 })
        }

        return NextResponse.json({ profile: minimalData })
      }

      return NextResponse.json({ error: `Error creating profile: ${error.message}` }, { status: 500 })
    }

    console.log("Profile created successfully:", data)
    return NextResponse.json({ profile: data })
  } catch (error: any) {
    console.error("Unexpected error in create-profile route:", error)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}

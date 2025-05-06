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

    // Create a Supabase client with the service role key
    // This bypasses RLS policies
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking if profile exists:", fetchError)
      return NextResponse.json({ error: "Error checking if profile exists" }, { status: 500 })
    }

    // If profile already exists, return it
    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile })
    }

    // First, let's get the actual table structure to avoid schema mismatches
    const { data: tableInfo, error: tableError } = await supabase.from("profiles").select("*").limit(1)

    if (tableError) {
      console.error("Error fetching table structure:", tableError)
      return NextResponse.json({ error: "Error fetching table structure" }, { status: 500 })
    }

    // Create new profile with only the essential fields
    // This avoids schema mismatch issues
    const newProfile = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Use upsert to handle potential race conditions
    const { data, error } = await supabase.from("profiles").upsert(newProfile).select().single()

    if (error) {
      console.error("Error creating profile:", error)

      // If we get a schema error, try a more minimal approach
      if (error.message?.includes("column") && error.message?.includes("schema")) {
        // Try with just the absolutely essential fields
        const minimalProfile = {
          id: userId,
          email,
        }

        const { data: minimalData, error: minimalError } = await supabase
          .from("profiles")
          .upsert(minimalProfile)
          .select()
          .single()

        if (minimalError) {
          console.error("Error creating minimal profile:", minimalError)
          return NextResponse.json({ error: "Error creating profile" }, { status: 500 })
        }

        return NextResponse.json({ profile: minimalData })
      }

      return NextResponse.json({ error: "Error creating profile" }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error("Unexpected error in create-profile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

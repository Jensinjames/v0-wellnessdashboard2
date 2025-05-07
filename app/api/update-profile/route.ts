import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { ProfileFormData } from "@/types/auth"

export async function POST(request: Request) {
  try {
    const { userId, profile } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile data is required" }, { status: 400 })
    }

    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session to verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Ensure the user is updating their own profile
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the columns of the profiles table to ensure we only update valid columns
    const { data: columns, error: columnsError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .then((result) => {
        if (result.data && result.data.length > 0) {
          // Extract column names from the first row
          return {
            data: Object.keys(result.data[0]),
            error: null,
          }
        }
        return {
          data: null,
          error: new Error("Could not determine table columns"),
        }
      })

    if (columnsError || !columns) {
      console.error("Error fetching table columns:", columnsError)
      return NextResponse.json({ error: "Could not determine table structure" }, { status: 500 })
    }

    // Filter the profile data to only include valid columns
    const validProfileData: Record<string, any> = {}
    Object.entries(profile as ProfileFormData).forEach(([key, value]) => {
      if (columns.includes(key)) {
        validProfileData[key] = value
      } else {
        console.warn(`Column '${key}' does not exist in the profiles table and will be ignored`)
      }
    })

    // Add updated_at timestamp
    if (columns.includes("updated_at")) {
      validProfileData.updated_at = new Date().toISOString()
    }

    console.log("Updating profile with data:", validProfileData)

    // Update the profile
    const { data, error } = await supabase.from("profiles").update(validProfileData).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: data,
    })
  } catch (error) {
    console.error("Unexpected error in update-profile route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

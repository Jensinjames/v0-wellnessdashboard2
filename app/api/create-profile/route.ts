import { NextResponse } from "next/server"
import { withPooledConnection } from "@/lib/supabase-server-optimized"

// Configurable retry settings
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 100

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    console.log(`Creating profile for user ${userId} with email ${email}`)

    return await createProfileWithRetry(userId, email, 0)
  } catch (error: any) {
    console.error("Unexpected error in create-profile route:", error)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}

async function createProfileWithRetry(userId: string, email: string, retryCount: number): Promise<NextResponse> {
  try {
    // Use the connection pool for better performance and reliability
    return await withPooledConnection(async (supabase) => {
      // First, check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (fetchError) {
        console.error("Error checking if profile exists:", fetchError)

        // If this is a connection error and we haven't exceeded retries, retry
        if (isConnectionError(fetchError) && retryCount < MAX_RETRIES) {
          return await retryWithBackoff(userId, email, retryCount)
        }

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

        // If this is a connection error and we haven't exceeded retries, retry
        if (isConnectionError(error) && retryCount < MAX_RETRIES) {
          return await retryWithBackoff(userId, email, retryCount)
        }

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
    })
  } catch (error: any) {
    console.error(`Unexpected error in create-profile route (attempt ${retryCount + 1}):`, error)

    // If we haven't exceeded retries, retry
    if (retryCount < MAX_RETRIES) {
      return await retryWithBackoff(userId, email, retryCount)
    }

    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}

async function retryWithBackoff(userId: string, email: string, retryCount: number): Promise<NextResponse> {
  const nextRetryCount = retryCount + 1
  const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, retryCount) * (0.75 + Math.random() * 0.5)

  console.log(`Retrying profile creation for user ${userId} in ${backoffTime}ms (attempt ${nextRetryCount})`)

  await new Promise((resolve) => setTimeout(resolve, backoffTime))
  return createProfileWithRetry(userId, email, nextRetryCount)
}

function isConnectionError(error: any): boolean {
  const errorMessage = error.message?.toLowerCase() || ""
  return (
    errorMessage.includes("connection") ||
    errorMessage.includes("network") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("socket") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("econnreset")
  )
}

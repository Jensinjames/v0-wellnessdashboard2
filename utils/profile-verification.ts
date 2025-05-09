import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

/**
 * Verifies if a user profile exists and creates it if missing
 * @param userId The user ID to verify
 * @returns A promise resolving to the verification result
 */
export async function verifyUserProfile(userId: string): Promise<{
  exists: boolean
  created: boolean
  error: Error | null
}> {
  if (!userId) {
    return { exists: false, created: false, error: new Error("User ID is required") }
  }

  const supabase = createClientComponentClient<Database>()

  try {
    // First check if the profile exists
    const { data: profile, error: checkError } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (checkError && !checkError.message.includes("No rows found")) {
      console.error("Error checking profile:", checkError)
      return { exists: false, created: false, error: new Error(checkError.message) }
    }

    // If profile exists, return success
    if (profile) {
      return { exists: true, created: false, error: null }
    }

    // If no profile exists, try to create one via the API
    const response = await fetch(`/api/verify-profiles?userId=${userId}`)

    if (!response.ok) {
      const errorText = await response.text()
      return { exists: false, created: false, error: new Error(errorText) }
    }

    const result = await response.json()
    return { exists: false, created: result.success, error: null }
  } catch (error: any) {
    console.error("Unexpected error during profile verification:", error)
    return {
      exists: false,
      created: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Repairs all missing user profiles
 * @returns A promise resolving to the repair result
 */
export async function repairAllProfiles(): Promise<{
  success: boolean
  results: any[]
  error: Error | null
}> {
  try {
    const response = await fetch("/api/verify-profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "repair_all" }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, results: [], error: new Error(errorText) }
    }

    const result = await response.json()
    return {
      success: result.success,
      results: result.results || [],
      error: null,
    }
  } catch (error: any) {
    console.error("Unexpected error repairing profiles:", error)
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

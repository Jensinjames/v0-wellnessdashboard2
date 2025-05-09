import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

/**
 * Utility functions for database recovery operations
 */

// Create a Supabase client
const supabase = createClientComponentClient<Database>()

/**
 * Attempts to repair user profile issues
 * @param userId - The user ID to repair the profile for
 * @returns A promise resolving to the success status and any error
 */
export async function repairUserProfile(userId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log(`Attempting to repair profile for user ${userId}`)

    // First check if the profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (checkError && !checkError.message.includes("No rows found")) {
      console.error("Error checking profile:", checkError)
      return { success: false, error: new Error(checkError.message) }
    }

    // If profile exists, no need to repair
    if (existingProfile) {
      console.log("Profile already exists, no repair needed")
      return { success: true, error: null }
    }

    // Get user details to create a profile
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("Error getting user data:", userError)
      return { success: false, error: new Error(userError.message) }
    }

    if (!userData.user) {
      return { success: false, error: new Error("No user found") }
    }

    // Create a minimal profile
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      email: userData.user.email || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error creating profile:", insertError)
      return { success: false, error: new Error(insertError.message) }
    }

    console.log("Successfully repaired user profile")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Unexpected error during profile repair:", error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Attempts to fix database permissions for a user
 * @param userId - The user ID to fix permissions for
 * @returns A promise resolving to the success status and any error
 */
export async function fixUserPermissions(userId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log(`Attempting to fix permissions for user ${userId}`)

    // Call a server function to fix permissions
    // This would typically be implemented as an API endpoint
    const response = await fetch("/api/fix-user-permissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: new Error(errorText) }
    }

    const result = await response.json()
    return { success: result.success, error: result.error ? new Error(result.error) : null }
  } catch (error: any) {
    console.error("Unexpected error fixing user permissions:", error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Attempts to recover from database errors during authentication
 * @param userId - The user ID to recover
 * @param email - The user's email
 * @returns A promise resolving to the success status and any error
 */
export async function recoverFromDatabaseError(
  userId: string,
  email: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log(`Attempting database error recovery for user ${userId}`)

    // Step 1: Try to repair the user profile
    const { success: profileSuccess, error: profileError } = await repairUserProfile(userId)

    if (profileError) {
      console.warn("Profile repair failed, but continuing with recovery:", profileError)
    }

    // Step 2: Try to fix user permissions
    const { success: permissionsSuccess, error: permissionsError } = await fixUserPermissions(userId)

    if (permissionsError) {
      console.warn("Permission fix failed, but continuing with recovery:", permissionsError)
    }

    // Step 3: Verify the recovery was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (verifyError) {
      console.error("Recovery verification failed:", verifyError)
      return { success: false, error: new Error("Recovery verification failed") }
    }

    console.log("Database error recovery completed successfully")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Unexpected error during database recovery:", error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

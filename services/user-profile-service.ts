/**
 * Service for managing user profiles
 */

import { createClient } from "@/lib/supabase-server"
import { safeDbOperation, logDatabaseError } from "@/utils/db-error-handler"
import type { Profile } from "@/types/profile"

/**
 * Create a new user profile
 */
export async function createUserProfile(
  userId: string,
  email: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  // Log the profile creation attempt
  console.log(`Creating profile for user ${userId} with email ${email}`)

  try {
    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // Log error if it's not just "no rows returned"
      logDatabaseError(fetchError, "checking existing profile")
      return {
        success: false,
        error: `Error checking for existing profile: ${fetchError.message}`,
      }
    }

    // If profile exists, return success
    if (existingProfile) {
      console.log(`Profile already exists for user ${userId}`)
      return { success: true, error: null }
    }

    // Create default profile
    const defaultProfile: Partial<Profile> = {
      id: userId,
      email,
      display_name: email.split("@")[0], // Default display name from email
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_complete: false,
      preferences: {
        theme: "system",
        notifications_enabled: true,
        email_notifications: true,
      },
    }

    // Insert the profile
    const { error: insertError } = await supabase.from("profiles").insert(defaultProfile)

    if (insertError) {
      logDatabaseError(insertError, "creating user profile")
      return {
        success: false,
        error: `Failed to create user profile: ${insertError.message}`,
      }
    }

    console.log(`Successfully created profile for user ${userId}`)
    return { success: true, error: null }
  } catch (error) {
    logDatabaseError(error, "createUserProfile")
    return {
      success: false,
      error: `Unexpected error creating profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
  const supabase = createClient()

  return safeDbOperation(async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) throw error
    return data as Profile
  }, "getUserProfile")
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  profileData: Partial<Profile>,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  try {
    // Ensure we're not overwriting the ID
    const sanitizedData = { ...profileData }
    delete sanitizedData.id

    // Add updated_at timestamp
    sanitizedData.updated_at = new Date().toISOString()

    const { error } = await supabase.from("profiles").update(sanitizedData).eq("id", userId)

    if (error) {
      logDatabaseError(error, "updateUserProfile")
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    logDatabaseError(error, "updateUserProfile")
    return {
      success: false,
      error: `Unexpected error updating profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

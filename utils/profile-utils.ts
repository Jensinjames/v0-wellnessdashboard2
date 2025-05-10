import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { ProfileFormData, UserProfile } from "@/types/auth"
import { migrateAnonymousUserData } from "@/lib/supabase-client-enhanced"

/**
 * Validates profile form data
 */
export function validateProfileData(profileData: ProfileFormData): Record<string, string> | null {
  const errors: Record<string, string> = {}

  if (!profileData.first_name || profileData.first_name.trim() === "") {
    errors.first_name = "First name is required"
  }

  if (!profileData.last_name || profileData.last_name.trim() === "") {
    errors.last_name = "Last name is required"
  }

  return Object.keys(errors).length > 0 ? errors : null
}

/**
 * Safely fetches a user profile with error handling
 */
export async function fetchProfileSafely(userId: string): Promise<{
  profile: UserProfile | null
  error: Error | null
}> {
  if (!userId) {
    return { profile: null, error: new Error("User ID is required") }
  }

  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return { profile: null, error: new Error(error.message) }
    }

    return { profile: data as UserProfile, error: null }
  } catch (error) {
    console.error("Unexpected error fetching profile:", error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Safely creates a user profile with error handling
 */
export async function createProfileSafely(
  userId: string,
  email: string,
): Promise<{
  profile: UserProfile | null
  error: Error | null
}> {
  if (!userId || !email) {
    return { profile: null, error: new Error("User ID and email are required") }
  }

  try {
    // First check if profile already exists
    const { profile: existingProfile } = await fetchProfileSafely(userId)
    if (existingProfile) {
      return { profile: existingProfile, error: null }
    }

    // Try to create profile via API route first (which has retry logic)
    try {
      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, email }),
      })

      if (response.ok) {
        const data = await response.json()
        return { profile: data.profile as UserProfile, error: null }
      }
    } catch (apiError) {
      console.warn("API route for profile creation failed, falling back to direct DB access:", apiError)
      // Continue with direct DB access as fallback
    }

    // Fallback to direct database access
    const supabase = createClientComponentClient()
    const newProfile = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(newProfile, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      return { profile: null, error: new Error(error.message) }
    }

    return { profile: data as UserProfile, error: null }
  } catch (error) {
    console.error("Unexpected error creating profile:", error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Ensures a user has a profile, creating one if it doesn't exist
 */
export async function ensureUserProfile(
  userId: string,
  email: string,
): Promise<{
  profile: UserProfile | null
  error: Error | null
}> {
  try {
    // First try to fetch the profile
    const { profile, error: fetchError } = await fetchProfileSafely(userId)

    // If profile exists, return it
    if (profile) {
      return { profile, error: null }
    }

    // If there was an error other than "not found", return the error
    if (fetchError && !fetchError.message.includes("not found")) {
      return { profile: null, error: fetchError }
    }

    // If profile doesn't exist, create it
    return await createProfileSafely(userId, email)
  } catch (error) {
    console.error("Unexpected error ensuring user profile:", error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Links anonymous user data to an authenticated user
 */
export async function linkAnonymousUserData(
  anonymousId: string,
  authenticatedId: string,
): Promise<{
  success: boolean
  error: Error | null
}> {
  if (!anonymousId || !authenticatedId) {
    return { success: false, error: new Error("Both anonymous and authenticated IDs are required") }
  }

  try {
    // Try to use the API route first
    try {
      const response = await fetch("/api/link-anonymous-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ anonymousId, authenticatedId }),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: data.success, error: null }
      }
    } catch (apiError) {
      console.warn("API route for linking anonymous data failed, falling back to direct function:", apiError)
      // Continue with direct function call as fallback
    }

    // Fallback to direct function call
    return await migrateAnonymousUserData(anonymousId, authenticatedId)
  } catch (error) {
    console.error("Unexpected error linking anonymous user data:", error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

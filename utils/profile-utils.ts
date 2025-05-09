import { requestCoordinator } from "@/lib/request-coordinator"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { getCacheItem, setCacheItem, CACHE_KEYS, CACHE_EXPIRY } from "@/lib/cache-utils"
import { getSupabaseClient } from "@/lib/supabase-client-enhanced"

// Create a Supabase client
const supabase = createClientComponentClient<Database>()

/**
 * Result type for profile operations
 */
export interface ProfileResult {
  profile: UserProfile | null
  error: Error | null
}

/**
 * Fetches a user profile with coordination to prevent race conditions
 * @param userId - The user ID to fetch the profile for
 * @returns A promise resolving to the profile result
 */
export async function fetchProfileSafely(userId: string): Promise<ProfileResult> {
  return requestCoordinator.coordinate(
    `profile-fetch-${userId}`,
    async () => {
      try {
        // Check cache first
        const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(userId))
        if (cachedProfile) {
          console.log(`Using cached profile for user ${userId}`)
          return { profile: cachedProfile, error: null }
        }

        console.log(`Fetching profile for user ${userId}`)
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error) {
          console.error(`Error fetching profile for user ${userId}:`, error)
          return { profile: null, error: new Error(error.message) }
        }

        // Cache the profile
        setCacheItem(CACHE_KEYS.PROFILE(userId), data as UserProfile, CACHE_EXPIRY.PROFILE)

        return { profile: data as UserProfile, error: null }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Unexpected error fetching profile for user ${userId}:`, errorMessage)
        return {
          profile: null,
          error: error instanceof Error ? error : new Error(errorMessage),
        }
      }
    },
    "fetchProfile",
  )
}

/**
 * Creates a user profile with coordination to prevent race conditions
 * @param userId - The user ID to create the profile for
 * @param email - The email address for the profile
 * @returns A promise resolving to the profile result
 */
export async function createProfileSafely(userId: string, email: string): Promise<ProfileResult> {
  return requestCoordinator.coordinate(
    `profile-create-${userId}`,
    async () => {
      try {
        console.log(`Creating profile for user ${userId} with email ${email}`)

        // First check if profile already exists
        const { profile: existingProfile, error: fetchError } = await fetchProfileSafely(userId)

        if (fetchError) {
          console.log(`Error checking for existing profile: ${fetchError.message}, proceeding with creation`)
        } else if (existingProfile) {
          console.log(`Profile already exists for user ${userId}, returning existing profile`)
          return { profile: existingProfile, error: null }
        }

        // Create the profile via API
        return createProfileViaAPI(userId, email)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Error creating profile for user ${userId}:`, errorMessage)
        return {
          profile: null,
          error: error instanceof Error ? error : new Error(errorMessage),
        }
      }
    },
    "createProfile",
  )
}

/**
 * Creates a profile via the API with retry logic
 * @param userId - The user ID to create the profile for
 * @param email - The email address for the profile
 * @param attempt - The current attempt number (for retry logic)
 * @returns A promise resolving to the profile result
 */
export async function createProfileViaAPI(userId: string, email: string, attempt = 1): Promise<ProfileResult> {
  try {
    console.log(`Attempting to create profile via API for user ${userId} (attempt ${attempt})`)

    // Add exponential backoff for retries
    if (attempt > 1) {
      const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      console.log(`Backing off for ${backoffTime}ms before retry`)
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
    }

    const response = await fetch("/api/create-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, email }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error (${response.status}): ${errorText}`)

      // Retry server errors (5xx) but not client errors (4xx)
      if (response.status >= 500 && attempt < 3) {
        return createProfileViaAPI(userId, email, attempt + 1)
      }

      return {
        profile: null,
        error: new Error(`API error (${response.status}): ${errorText}`),
      }
    }

    interface ApiResponse {
      profile?: UserProfile
      error?: string
    }

    const data = (await response.json()) as ApiResponse

    if (data.error) {
      console.error("API returned error:", data.error)
      return { profile: null, error: new Error(data.error) }
    }

    if (!data.profile) {
      console.error("API returned no profile:", data)
      return { profile: null, error: new Error("No profile returned from API") }
    }

    // Cache the profile
    setCacheItem(CACHE_KEYS.PROFILE(userId), data.profile, CACHE_EXPIRY.PROFILE)

    return { profile: data.profile, error: null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error creating profile via API (attempt ${attempt}):`, errorMessage)

    // Retry network errors
    if (attempt < 3) {
      return createProfileViaAPI(userId, email, attempt + 1)
    }

    return {
      profile: null,
      error: error instanceof Error ? error : new Error(errorMessage),
    }
  }
}

/**
 * Check if a profile is complete (has first name and last name)
 * @param profile - The profile to check, or null/undefined
 * @returns True if the profile is complete, false otherwise
 */
export function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false
  return Boolean(profile.first_name) && Boolean(profile.last_name)
}

/**
 * Validates a profile form data object
 * @param formData - The profile form data to validate
 * @returns An object containing validation errors, or null if valid
 */
export function validateProfileData(formData: ProfileFormData): Record<string, string> | null {
  const errors: Record<string, string> = {}

  if (!formData.first_name || formData.first_name.trim() === "") {
    errors.first_name = "First name is required"
  }

  if (!formData.last_name || formData.last_name.trim() === "") {
    errors.last_name = "Last name is required"
  }

  return Object.keys(errors).length > 0 ? errors : null
}

/**
 * Creates a minimal profile object with required fields
 * @param userId - The user ID for the profile
 * @param email - The email address for the profile
 * @returns A minimal valid profile object
 */
export function createMinimalProfile(userId: string, email?: string | null): UserProfile {
  return {
    id: userId,
    email: email || "",
    first_name: "",
    last_name: "",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Ensures a user profile exists, creating one if it doesn't
 * @param userId - The user ID to ensure a profile for
 * @param email - The email address for the profile
 * @returns A promise resolving to the profile result
 */
export async function ensureUserProfile(userId: string, email: string): Promise<ProfileResult> {
  try {
    // First try to fetch the profile
    const { profile, error } = await fetchProfileSafely(userId)

    // If profile exists, return it
    if (profile) {
      return { profile, error: null }
    }

    // If error is not "not found", return the error
    if (error && !error.message.includes("not found")) {
      return { profile: null, error }
    }

    // Profile doesn't exist, create it
    return await createProfileSafely(userId, email)
  } catch (error: any) {
    console.error("Error ensuring user profile:", error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Links anonymous user data to an authenticated user
 * @param anonymousId - The anonymous user ID
 * @param authenticatedId - The authenticated user ID
 * @returns A promise resolving to the result of the operation
 */
export async function linkAnonymousUserData(
  anonymousId: string,
  authenticatedId: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Get the enhanced Supabase client
    const client = await getSupabaseClient()

    console.log(`Linking anonymous user ${anonymousId} data to authenticated user ${authenticatedId}`)

    // First, check if the anonymous user has any data
    const { data: anonymousData, error: checkError } = await client
      .from("user_data")
      .select("id")
      .eq("user_id", anonymousId)
      .limit(1)

    if (checkError) {
      console.error("Error checking for anonymous user data:", checkError)
      return { success: false, error: new Error(checkError.message) }
    }

    // If no data, nothing to migrate
    if (!anonymousData || anonymousData.length === 0) {
      console.log("No anonymous data found to migrate")
      return { success: true, error: null }
    }

    // Call a database function to handle the migration
    const { error: migrationError } = await client.rpc("migrate_user_data", {
      source_id: anonymousId,
      target_id: authenticatedId,
    })

    if (migrationError) {
      console.error("Error migrating user data:", migrationError)
      return {
        success: false,
        error: new Error(`Failed to migrate user data: ${migrationError.message}`),
      }
    }

    console.log("Successfully migrated anonymous user data")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Unexpected error during user data migration:", error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

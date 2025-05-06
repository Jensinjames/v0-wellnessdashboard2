import { requestCoordinator } from "@/lib/request-coordinator"
import type { UserProfile } from "@/types/auth"
import { getCacheItem, setCacheItem, CACHE_KEYS, CACHE_EXPIRY } from "@/lib/cache-utils"
import { getSupabaseClient } from "@/lib/supabase-client-enhanced"

/**
 * Result type for profile operations
 */
export interface ProfileResult {
  profile: UserProfile | null
  error: Error | null
}

/**
 * Fetches a user profile with coordination to prevent race conditions
 * Uses enhanced connection management for reliability
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

        // Get client with enhanced connection management
        const supabase = await getSupabaseClient({
          timeout: 10000,
          retryOnError: true,
          maxRetries: 2,
        })

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
 * Uses enhanced connection management and retry logic
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

        // Create the profile via API with enhanced reliability
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
 * Creates a profile via the API with enhanced retry logic
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
      const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000) * (0.8 + Math.random() * 0.4)
      console.log(`Backing off for ${backoffTime}ms before retry`)
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
    }

    // Use AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch("/api/create-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, email }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

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

    // Check if it's an abort error (timeout)
    const isTimeoutError = error instanceof DOMException && error.name === "AbortError"

    // Retry network errors and timeouts
    if (attempt < 3 && (error instanceof TypeError || isTimeoutError)) {
      return createProfileViaAPI(userId, email, attempt + 1)
    }

    return {
      profile: null,
      error: error instanceof Error ? error : new Error(errorMessage),
    }
  }
}

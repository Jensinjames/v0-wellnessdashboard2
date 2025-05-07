import type { Database } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

// Profile types to return
export interface VerificationStatus {
  emailVerified: boolean
  phoneVerified: boolean
  verificationInProgress?: boolean
  lastVerificationAttempt?: string | null
}

export interface UserProfileData {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  email_verified: boolean
  phone?: string | null
  phone_verified: boolean
  avatar_url?: string | null
}

// Cache configuration
const VERIFICATION_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const PROFILE_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

/**
 * Check if a user exists by email
 */
export async function checkUserExists(email: string, supabase: SupabaseClient<Database>) {
  try {
    // Use direct SQL query for better performance
    const { data, error } = await supabase.rpc("check_user_exists", { email_to_check: email })

    if (error) throw error

    return { exists: !!data, error: null }
  } catch (error: any) {
    console.error("Error checking user existence:", error.message)
    return { exists: false, error: error.message }
  }
}

/**
 * Get user verification status with caching
 */
export async function getVerificationStatus(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<{ status: VerificationStatus | null; error: string | null }> {
  try {
    // Try edge function first (more efficient)
    try {
      const response = await fetch("/api/auth/user-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-verification-status" }),
      })

      if (response.ok) {
        const data = await response.json()
        const status = {
          emailVerified: data.emailVerified,
          phoneVerified: data.phoneVerified,
          verificationInProgress: false,
        }

        // Cache the result
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`verification_status:${userId}`, JSON.stringify(status))
            localStorage.setItem(`verification_status_time:${userId}`, Date.now().toString())
          } catch (e) {
            // Ignore cache errors
          }
        }

        return { status, error: null }
      }
    } catch (e) {
      // Fall back to direct query if edge function fails
      console.warn("Edge function failed, falling back to direct query", e)
    }

    // Direct query fallback
    const { data, error } = await supabase
      .from("profiles")
      .select("email_verified, phone_verified")
      .eq("id", userId)
      .single()

    if (error) throw error

    const status: VerificationStatus = {
      emailVerified: data.email_verified,
      phoneVerified: data.phone_verified,
      verificationInProgress: false,
    }

    // Cache the result
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`verification_status:${userId}`, JSON.stringify(status))
        localStorage.setItem(`verification_status_time:${userId}`, Date.now().toString())
      } catch (e) {
        // Ignore cache errors
      }
    }

    return { status, error: null }
  } catch (error: any) {
    console.error("Error getting verification status:", error.message)
    return { status: null, error: error.message }
  }
}

/**
 * Get user profile with optimized performance
 */
export async function getUserProfile(
  userId: string,
  supabase: SupabaseClient<Database>,
  options: { force?: boolean } = {},
): Promise<{ profile: UserProfileData | null; error: string | null }> {
  const { force = false } = options

  // Check cache first unless forced refresh
  if (!force && typeof window !== "undefined") {
    try {
      const cachedProfile = localStorage.getItem(`user_profile:${userId}`)
      const cacheTimestamp = localStorage.getItem(`user_profile_time:${userId}`)

      if (cachedProfile && cacheTimestamp) {
        const timestamp = Number.parseInt(cacheTimestamp, 10)
        const now = Date.now()

        // If cache is fresh enough, use it
        if (now - timestamp < PROFILE_CACHE_TTL) {
          return { profile: JSON.parse(cachedProfile), error: null }
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
  }

  // Use edge function for better performance
  try {
    const response = await fetch("/api/auth/user-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate-user", userId }),
    })

    if (response.ok) {
      const data = await response.json()

      if (data.profile) {
        // Cache the result
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`user_profile:${userId}`, JSON.stringify(data.profile))
            localStorage.setItem(`user_profile_time:${userId}`, Date.now().toString())
          } catch (e) {
            // Ignore cache errors
          }
        }

        return { profile: data.profile, error: null }
      }
    }

    // Fall back to direct query if edge function fails
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, email_verified, phone, phone_verified, avatar_url")
      .eq("id", userId)
      .single()

    if (error) throw error

    // Cache the result
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`user_profile:${userId}`, JSON.stringify(data))
        localStorage.setItem(`user_profile_time:${userId}`, Date.now().toString())
      } catch (e) {
        // Ignore cache errors
      }
    }

    return { profile: data as UserProfileData, error: null }
  } catch (error: any) {
    console.error("Error getting user profile:", error.message)
    return { profile: null, error: error.message }
  }
}

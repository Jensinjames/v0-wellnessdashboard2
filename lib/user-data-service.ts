/**
 * User Data Service
 *
 * A service for managing user data operations without admin privileges
 */

import { getSupabaseClient } from "@/lib/supabase-client-unified"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { getCacheItem, setCacheItem, CACHE_KEYS, CACHE_EXPIRY } from "@/lib/cache-utils"

// Debug mode flag
const DEBUG_MODE = process.env.NODE_ENV === "development"

// Debug logging
function debugLog(...args: any[]): void {
  if (DEBUG_MODE) {
    console.log("[User Data Service]", ...args)
  }
}

/**
 * Gets a user's profile from cache or database
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null

  try {
    // Check cache first
    const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(userId))
    if (cachedProfile) {
      debugLog("Using cached profile for user", userId)
      return cachedProfile
    }

    debugLog("Fetching profile for user", userId)

    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    const profile = data as UserProfile

    // Cache the profile
    setCacheItem(CACHE_KEYS.PROFILE(userId), profile, CACHE_EXPIRY.PROFILE)

    return profile
  } catch (error) {
    console.error("Unexpected error fetching profile:", error)
    return null
  }
}

/**
 * Creates a new user profile
 */
export async function createUserProfile(userId: string, email?: string): Promise<UserProfile | null> {
  if (!userId) return null

  try {
    debugLog("Creating profile for user", userId)

    const supabase = getSupabaseClient()

    // If email is not provided, try to get it from auth
    if (!email) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      email = user?.email
    }

    if (!email) {
      console.error("Cannot create profile without email")
      return null
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (existingProfile) {
      debugLog("Profile already exists")
      return existingProfile as UserProfile
    }

    // Create new profile
    const newProfile = {
      id: userId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("profiles").insert(newProfile).select().single()

    if (error) {
      console.error("Error creating profile:", error)
      return null
    }

    const profile = data as UserProfile

    // Cache the profile
    setCacheItem(CACHE_KEYS.PROFILE(userId), profile, CACHE_EXPIRY.PROFILE)

    return profile
  } catch (error) {
    console.error("Unexpected error creating profile:", error)
    return null
  }
}

/**
 * Updates a user profile
 */
export async function updateUserProfile(
  userId: string,
  profileData: ProfileFormData,
): Promise<{ success: boolean; profile: UserProfile | null; error: Error | null }> {
  if (!userId) {
    return {
      success: false,
      profile: null,
      error: new Error("User ID is required"),
    }
  }

  try {
    debugLog("Updating profile for user", userId)

    const supabase = getSupabaseClient()

    // Prepare update data
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    // Update profile
    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        profile: null,
        error: new Error(error.message),
      }
    }

    const profile = data as UserProfile

    // Update cache
    setCacheItem(CACHE_KEYS.PROFILE(userId), profile, CACHE_EXPIRY.PROFILE)

    return {
      success: true,
      profile,
      error: null,
    }
  } catch (error: any) {
    console.error("Unexpected error updating profile:", error)
    return {
      success: false,
      profile: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Checks if a user profile exists
 */
export async function doesProfileExist(userId: string): Promise<boolean> {
  if (!userId) return false

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (error) {
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error checking if profile exists:", error)
    return false
  }
}

/**
 * Checks if a profile is complete (has required fields)
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false

  return Boolean(profile.first_name) && Boolean(profile.last_name)
}

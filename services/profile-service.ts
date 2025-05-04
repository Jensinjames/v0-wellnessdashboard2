import { getSupabaseClient } from "@/lib/supabase"
import type { UserProfile } from "@/types/profile"
import profileCache from "./profile-cache-service"
import { safelyMigrateProfile } from "@/utils/profile-migration-fixed"

export class ProfileService {
  /**
   * Get a user profile by ID, with caching
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    // Try to get from cache first
    const cachedProfile = profileCache.get(userId)
    if (cachedProfile) {
      return cachedProfile
    }

    const supabase = getSupabaseClient()

    try {
      // Try to get from database
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        // If profile doesn't exist, try to migrate/create it
        if (error.code === "PGRST116") {
          // No rows returned
          const migratedProfile = await safelyMigrateProfile(userId)

          if (migratedProfile) {
            // Cache the migrated profile
            profileCache.set(userId, migratedProfile)
          }

          return migratedProfile
        }

        console.error("Error fetching profile:", error)
        return null
      }

      // Cache the profile
      profileCache.set(userId, data as UserProfile)

      return data as UserProfile
    } catch (error) {
      console.error("Exception in getProfile:", error)
      return null
    }
  }

  /**
   * Update a user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const supabase = getSupabaseClient()

    try {
      // Update the profile
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating profile:", error)
        return null
      }

      // Invalidate cache
      profileCache.invalidate(userId)

      return data as UserProfile
    } catch (error) {
      console.error("Exception in updateProfile:", error)
      return null
    }
  }

  /**
   * Create a new user profile
   */
  async createProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const supabase = getSupabaseClient()

    try {
      // Create the profile
      const { data, error } = await supabase
        .from("profiles")
        .insert([
          {
            ...profile,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating profile:", error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error("Exception in createProfile:", error)
      return null
    }
  }

  /**
   * Delete a user profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    const supabase = getSupabaseClient()

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId)

      if (error) {
        console.error("Error deleting profile:", error)
        return false
      }

      // Invalidate cache
      profileCache.invalidate(userId)

      return true
    } catch (error) {
      console.error("Exception in deleteProfile:", error)
      return false
    }
  }
}

// Create a singleton instance
const profileService = new ProfileService()

export default profileService

import { getSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-client"
import type { Database } from "@/types/supabase"

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
export type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"]
export type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"]

export class UserService {
  /**
   * Creates a new user profile in the user_profiles table
   */
  static async createUserProfile(profile: UserProfileInsert): Promise<UserProfile | null> {
    try {
      // Use admin client for initial creation (avoids RLS issues)
      const supabase = getSupabaseAdmin()

      // Check if a profile with this auth_id already exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", profile.auth_id)
        .maybeSingle()

      if (existingProfile) {
        console.log("Profile already exists for auth_id:", profile.auth_id)
        return existingProfile
      }

      // Insert the new profile
      const { data, error } = await supabase.from("user_profiles").insert([profile]).select().single()

      if (error) {
        console.error("Error creating user profile:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Failed to create user profile:", error)
      return null
    }
  }

  /**
   * Gets a user profile by auth_id
   */
  static async getUserProfileByAuthId(authId: string): Promise<UserProfile | null> {
    try {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.from("user_profiles").select("*").eq("auth_id", authId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      return null
    }
  }

  /**
   * Gets a user profile by email
   */
  static async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      const supabase = getSupabaseAdmin() // Using admin to bypass RLS

      const { data, error } = await supabase.from("user_profiles").select("*").eq("email", email).single()

      if (error) {
        console.error("Error fetching user profile by email:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Failed to fetch user profile by email:", error)
      return null
    }
  }

  /**
   * Updates a user profile
   */
  static async updateUserProfile(id: string, updates: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", id).select().single()

      if (error) {
        console.error("Error updating user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Failed to update user profile:", error)
      return null
    }
  }

  /**
   * Creates the user_profiles table if it doesn't exist
   */
  static async createUserProfilesTable(): Promise<boolean> {
    try {
      // Call the API endpoint to set up the table
      const response = await fetch("/api/setup")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to create user_profiles table")
      }

      return true
    } catch (error) {
      console.error("Failed to create user_profiles table:", error)
      return false
    }
  }
}

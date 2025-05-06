import { getSupabaseClient } from "@/lib/supabase-client"
import type { Database } from "@/types/supabase"

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
export type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"]
export type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"]

export class UserService {
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
}

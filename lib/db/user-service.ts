import { getServerDb, handleDbError, logDbOperation, type DbResult, validateInput } from "./db-utils"
import { z } from "zod"
import type { Database } from "@/types/supabase"

// Type for user profile
export type UserProfile = Database["public"]["Tables"]["users"]["Row"]

// Schema for user profile updates
const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z.string().optional(),
  location: z.string().optional(),
})

export type UserProfileUpdate = z.infer<typeof userProfileSchema>

/**
 * Get a user's profile by ID
 */
export async function getUserProfile(userId: string): Promise<DbResult<UserProfile>> {
  try {
    logDbOperation("getUserProfile", { userId })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "getUserProfile" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      return { data: null, error: handleDbError(error, "getUserProfile") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getUserProfile") }
  }
}

/**
 * Update a user's profile
 */
export async function updateUserProfile(userId: string, profile: UserProfileUpdate): Promise<DbResult<UserProfile>> {
  try {
    logDbOperation("updateUserProfile", { userId, profile })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "updateUserProfile" },
      }
    }

    const validation = validateInput(profile, userProfileSchema)
    if (validation.error) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "updateUserProfile" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("users")
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "updateUserProfile") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "updateUserProfile") }
  }
}

/**
 * Create a new user profile
 */
export async function createUserProfile(userId: string, email: string, name: string): Promise<DbResult<UserProfile>> {
  try {
    logDbOperation("createUserProfile", { userId, email, name })

    // Input validation
    if (!userId || !email) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "User ID and email are required",
          details: null,
          operation: "createUserProfile",
        },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        email,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "createUserProfile") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "createUserProfile") }
  }
}

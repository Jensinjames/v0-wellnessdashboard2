"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { z } from "zod"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Schema for profile validation
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name is too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  bio: z.string().max(500, "Bio is too long").optional(),
  avatar_url: z.string().url("Invalid URL").optional().nullable(),
  timezone: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  email_notifications: z.boolean().optional(),
})

// Type for the return value of our actions
type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData | Record<string, any>): Promise<ActionResult<Profile>> {
  try {
    // Get data from FormData or direct object
    const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

    // Convert checkbox values to booleans
    if (rawData.email_notifications) {
      rawData.email_notifications =
        rawData.email_notifications === "on" ||
        rawData.email_notifications === "true" ||
        rawData.email_notifications === true
    }

    // Validate the data
    const validationResult = profileSchema.safeParse(rawData)

    if (!validationResult.success) {
      // Return field-specific errors
      const fieldErrors = validationResult.error.errors.reduce(
        (acc, error) => {
          acc[error.path[0]] = error.message
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        success: false,
        error: "Invalid profile data",
        fieldErrors,
      }
    }

    const profileData = validationResult.data

    // Get the current user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Update the profile
    const updates = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

    if (error) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        error: "Failed to update profile",
      }
    }

    // Revalidate relevant paths
    revalidatePath("/profile")

    return {
      success: true,
      data: data as Profile,
      message: "Profile updated successfully",
    }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

/**
 * Update email verification status
 * This would typically be called after verifying an email
 */
export async function updateEmailVerification(verified: boolean): Promise<ActionResult> {
  try {
    // Get the current user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Update the profile
    const { error } = await supabase
      .from("profiles")
      .update({
        email_verified: verified,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("Error updating email verification:", error)
      return {
        success: false,
        error: "Failed to update email verification status",
      }
    }

    // Revalidate relevant paths
    revalidatePath("/profile")

    return {
      success: true,
      message: "Email verification status updated successfully",
    }
  } catch (error) {
    console.error("Unexpected error updating email verification:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

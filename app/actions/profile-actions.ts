"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase-server"
import { getUserProfile, updateUserProfile, type UserProfileUpdate } from "@/lib/db"

/**
 * Get the authenticated user's profile
 */
export async function getProfile() {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || "User not authenticated" }
    }

    // Get user profile using the database service
    const { data, error } = await getUserProfile(user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, profile: data }
  } catch (error) {
    console.error("Get profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Update the authenticated user's profile
 */
export async function updateProfile(formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || "User not authenticated" }
    }

    // Extract profile data from form
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const location = formData.get("location") as string

    // Update user metadata in auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { name },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    // Update user profile using the database service
    const profileData: UserProfileUpdate = {
      name,
      phone,
      location,
    }

    const { data, error } = await updateUserProfile(user.id, profileData)

    if (error) {
      return { success: false, error: error.message }
    }
    \
      profileData)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate the profile page
    revalidatePath("/profile")

    return { success: true, data }
  } catch (error) {
    console.error("Update profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Update the authenticated user's password
 */
export async function updatePassword(formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const password = formData.get("password") as string

    // Update user password
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

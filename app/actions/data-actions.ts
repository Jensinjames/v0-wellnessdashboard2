"use server"

import { createActionClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { handleSupabaseError } from "@/utils/supabase-error-handler"

/**
 * Creates a new category for the authenticated user
 */
export async function createCategory(formData: FormData) {
  const supabase = createActionClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || "User not authenticated" }
    }

    const name = formData.get("name") as string
    const color = formData.get("color") as string
    const icon = formData.get("icon") as string
    const description = formData.get("description") as string

    // Insert new category
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        color,
        icon,
        description,
        user_id: user.id,
      })
      .select()

    if (error) {
      const errorInfo = handleSupabaseError(error, "Failed to create category")
      return { success: false, error: errorInfo.message }
    }

    // Revalidate relevant paths
    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error) {
    console.error("Create category error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Creates a new entry for the authenticated user
 */
export async function createEntry(formData: FormData) {
  const supabase = createActionClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || "User not authenticated" }
    }

    const category_id = formData.get("category_id") as string
    const date = formData.get("date") as string
    const duration = Number.parseInt(formData.get("duration") as string, 10)
    const notes = formData.get("notes") as string

    // Insert new entry
    const { data, error } = await supabase
      .from("entries")
      .insert({
        category_id,
        date,
        duration,
        notes,
        user_id: user.id,
      })
      .select()

    if (error) {
      const errorInfo = handleSupabaseError(error, "Failed to create entry")
      return { success: false, error: errorInfo.message }
    }

    // Revalidate relevant paths
    revalidatePath("/activity")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error) {
    console.error("Create entry error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Creates a new goal for the authenticated user
 */
export async function createGoal(formData: FormData) {
  const supabase = createActionClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || "User not authenticated" }
    }

    const category_id = formData.get("category_id") as string
    const target_duration = Number.parseInt(formData.get("target_duration") as string, 10)
    const timeframe = formData.get("timeframe") as string
    const start_date = formData.get("start_date") as string
    const end_date = formData.get("end_date") as string

    // Insert new goal
    const { data, error } = await supabase
      .from("goals")
      .insert({
        category_id,
        target_duration,
        timeframe,
        start_date,
        end_date,
        user_id: user.id,
      })
      .select()

    if (error) {
      const errorInfo = handleSupabaseError(error, "Failed to create goal")
      return { success: false, error: errorInfo.message }
    }

    // Revalidate relevant paths
    revalidatePath("/goals")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error) {
    console.error("Create goal error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

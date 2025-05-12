"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase-server"
import {
  createGoal,
  updateGoal,
  deleteGoal,
  getUserGoals,
  getCategoryGoals,
  getGoalById,
  getGoalProgress,
  type GoalCreate,
  type GoalUpdate,
} from "@/lib/db"

/**
 * Get all goals for the authenticated user
 */
export async function getGoals() {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get goals using the database service
    const { data, error } = await getUserGoals(user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get goals error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get goals for a specific category
 */
export async function getCategoryGoalsAction(categoryId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get category goals using the database service
    const { data, error } = await getCategoryGoals(categoryId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get category goals error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get a goal by ID
 */
export async function getGoal(goalId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get goal using the database service
    const { data, error } = await getGoalById(goalId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get goal error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get goal progress
 */
export async function getGoalProgressAction(goalId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get goal progress using the database service
    const { data, error } = await getGoalProgress(goalId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get goal progress error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Create a new goal for the authenticated user
 */
export async function createGoalAction(formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract goal data from form
    const category_id = formData.get("category_id") as string
    const target_duration = Number.parseInt(formData.get("target_duration") as string, 10)
    const timeframe = formData.get("timeframe") as "daily" | "weekly" | "monthly" | "yearly"
    const start_date = formData.get("start_date") as string
    const end_date = (formData.get("end_date") as string) || undefined
    const target_value = formData.has("target_value")
      ? Number.parseFloat(formData.get("target_value") as string)
      : undefined
    const description = (formData.get("description") as string) || undefined

    // Create goal using the database service
    const goalData: GoalCreate = {
      category_id,
      target_duration,
      timeframe,
      start_date,
      end_date,
      target_value,
      description,
    }

    const { data, error } = await createGoal(goalData, user.id)

    if (error) {
      return { success: false, error: error.message }
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

/**
 * Update a goal for the authenticated user
 */
export async function updateGoalAction(goalId: string, formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract goal data from form
    const category_id = formData.get("category_id") as string
    const target_duration = Number.parseInt(formData.get("target_duration") as string, 10)
    const timeframe = formData.get("timeframe") as "daily" | "weekly" | "monthly" | "yearly"
    const start_date = formData.get("start_date") as string
    const end_date = (formData.get("end_date") as string) || undefined
    const target_value = formData.has("target_value")
      ? Number.parseFloat(formData.get("target_value") as string)
      : undefined
    const description = (formData.get("description") as string) || undefined

    // Update goal using the database service
    const goalData: GoalUpdate = {
      category_id,
      target_duration,
      timeframe,
      start_date,
      end_date,
      target_value,
      description,
    }

    const { data, error } = await updateGoal(goalId, goalData, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/goals")
    revalidatePath("/dashboard")
    revalidatePath(`/goals/${goalId}`)

    return { success: true, data }
  } catch (error) {
    console.error("Update goal error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Delete a goal for the authenticated user
 */
export async function deleteGoalAction(goalId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Delete goal using the database service
    const { error } = await deleteGoal(goalId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/goals")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Delete goal error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

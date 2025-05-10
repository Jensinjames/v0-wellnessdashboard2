"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { z } from "zod"
import type { CategoryGoal } from "@/types/wellness"

// Schema for goal validation
const goalSchema = z.object({
  category: z.string().min(1, "Category is required"),
  goal_hours: z.number().min(0, "Goal hours cannot be negative").max(168, "Goal hours cannot exceed 168 (a week)"),
  notes: z.string().max(500, "Notes are too long").optional(),
})

// Type for the return value of our actions
type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Update a wellness goal
 */
export async function updateGoal(formData: FormData | Record<string, any>): Promise<ActionResult<CategoryGoal>> {
  try {
    // Get data from FormData or direct object
    const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

    // Convert goal_hours to number
    if (typeof rawData.goal_hours === "string") {
      rawData.goal_hours = Number.parseFloat(rawData.goal_hours)
    }

    // Validate the data
    const validationResult = goalSchema.safeParse(rawData)

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
        error: "Invalid goal data",
        fieldErrors,
      }
    }

    const { category, goal_hours, notes } = validationResult.data

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

    // Check if the goal exists
    const { data: existingGoal, error: fetchError } = await supabase
      .from("wellness_goals")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", category)
      .maybeSingle()

    let result

    if (existingGoal) {
      // Update existing goal
      const { data, error } = await supabase
        .from("wellness_goals")
        .update({
          goal_hours,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingGoal.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating goal:", error)
        return {
          success: false,
          error: "Failed to update goal",
        }
      }

      result = data
    } else {
      // Create new goal
      const newGoal = {
        user_id: user.id,
        category,
        goal_hours,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("wellness_goals").insert(newGoal).select().single()

      if (error) {
        console.error("Error creating goal:", error)
        return {
          success: false,
          error: "Failed to create goal",
        }
      }

      result = data
    }

    // Revalidate relevant paths
    revalidatePath("/goals")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: result as CategoryGoal,
      message: existingGoal ? "Goal updated successfully" : "Goal created successfully",
    }
  } catch (error) {
    console.error("Unexpected error updating goal:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

/**
 * Get all goals for the current user
 */
export async function getGoals(): Promise<ActionResult<CategoryGoal[]>> {
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

    // Get all goals for this user
    const { data, error } = await supabase
      .from("wellness_goals")
      .select(`
        id,
        category,
        goal_hours,
        notes,
        wellness_categories!inner(name, color)
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching goals:", error)
      return {
        success: false,
        error: "Failed to fetch goals",
      }
    }

    // Transform the data to match our CategoryGoal type
    const goals = data.map((goal) => ({
      id: goal.id,
      category: goal.category,
      name: goal.wellness_categories.name,
      goal_hours: goal.goal_hours,
      color: goal.wellness_categories.color,
      notes: goal.notes,
    })) as CategoryGoal[]

    return {
      success: true,
      data: goals,
    }
  } catch (error) {
    console.error("Unexpected error fetching goals:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

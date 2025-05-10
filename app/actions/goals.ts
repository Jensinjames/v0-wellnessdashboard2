"use server"
import type { CategoryGoal, CategoryType } from "@/types/wellness"
import { revalidatePath } from "next/cache"
import { updateWellnessGoal, getUserProgressSummary } from "@/utils/supabase-functions"

export async function updateGoal(
  userId: string,
  goal: Partial<CategoryGoal>,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!goal.category || goal.goal_hours === undefined) {
      return { success: false, error: "Category and goal hours are required" }
    }

    // Use the database function instead of multiple queries
    const result = await updateWellnessGoal(userId, goal.category as CategoryType, goal.goal_hours)

    if (!result.success) {
      console.error("Error updating goal:", result.error)
      return { success: false, error: result.error }
    }

    // Revalidate the dashboard page to show updated goals
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error updating goal:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function getGoals(userId: string): Promise<CategoryGoal[]> {
  try {
    // Get the progress summary which includes goals with category information
    const { success, data, error } = await getUserProgressSummary(userId)

    if (!success || !data) {
      console.error("Error fetching goals:", error)
      throw new Error(error || "Failed to fetch goals")
    }

    // Extract categories with goal information
    const categories = data.categories || []

    // Transform the data to match our CategoryGoal type
    return categories.map((cat: any) => {
      return {
        id: cat.id,
        category: cat.id as CategoryType,
        name: cat.name,
        goal_hours: cat.goal_hours || 0,
        color: cat.color || "#000000",
      }
    })
  } catch (error) {
    console.error("Unexpected error fetching goals:", error)
    return []
  }
}

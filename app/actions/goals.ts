"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { CategoryGoal, CategoryType } from "@/types/wellness"
import { revalidatePath } from "next/cache"

export async function updateGoal(
  userId: string,
  goal: Partial<CategoryGoal>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // Check if goal exists
    const { data: existingGoal, error: fetchError } = await supabase
      .from("wellness_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("category", goal.category)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine - we'll create a new goal
      console.error("Error fetching goal:", fetchError)
      return { success: false, error: fetchError.message }
    }

    let result

    if (existingGoal) {
      // Update existing goal
      result = await supabase
        .from("wellness_goals")
        .update({
          goal_hours: goal.goal_hours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingGoal.id)
    } else {
      // Create new goal
      result = await supabase.from("wellness_goals").insert({
        user_id: userId,
        category: goal.category,
        goal_hours: goal.goal_hours,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      console.error("Error updating goal:", result.error)
      return { success: false, error: result.error.message }
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
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("wellness_goals")
      .select(`
        id,
        category,
        goal_hours
      `)
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching goals:", error)
      throw new Error(error.message)
    }

    // Get categories for colors
    const { data: categories, error: categoriesError } = await supabase
      .from("wellness_categories")
      .select("id, name, color")

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
    }

    // Create a map of category colors
    const categoryMap = new Map()
    if (categories) {
      categories.forEach((cat) => {
        categoryMap.set(cat.id, {
          name: cat.name,
          color: cat.color,
        })
      })
    }

    // Transform the data to match our CategoryGoal type
    return data.map((goal) => {
      const category = goal.category as CategoryType
      const categoryInfo = categoryMap.get(category) || {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        color: "#000000",
      }

      return {
        id: goal.id,
        category: category,
        name: categoryInfo.name,
        goal_hours: goal.goal_hours,
        color: categoryInfo.color,
      }
    })
  } catch (error) {
    console.error("Unexpected error fetching goals:", error)
    return []
  }
}

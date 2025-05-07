"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { GoalCategory, GoalSubcategory, Goal, TimeEntry } from "@/types/goals-hierarchy"

// Categories
export async function getCategories(userId: string): Promise<GoalCategory[]> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("goal_categories")
      .select(`
        *,
        subcategories:goal_subcategories(
          *,
          goals:goals(*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at")

    if (error) {
      console.error("Error fetching categories:", error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error: any) {
    console.error("Unexpected error fetching categories:", error)
    return []
  }
}

export async function createCategory(
  userId: string,
  category: Partial<GoalCategory>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("goal_categories")
      .insert({
        name: category.name,
        description: category.description || "",
        color: category.color,
        icon: category.icon || "",
        user_id: userId,
        daily_time_allocation: category.daily_time_allocation || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating category:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Unexpected error creating category:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  updates: Partial<GoalCategory>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("goal_categories")
      .update({
        name: updates.name,
        description: updates.description,
        color: updates.color,
        icon: updates.icon,
        daily_time_allocation: updates.daily_time_allocation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating category:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error updating category:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function deleteCategory(
  userId: string,
  categoryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // First, delete all goals in all subcategories of this category
    const { data: subcategories, error: fetchError } = await supabase
      .from("goal_subcategories")
      .select("id")
      .eq("category_id", categoryId)

    if (fetchError) {
      console.error("Error fetching subcategories:", fetchError)
      return { success: false, error: fetchError.message }
    }

    if (subcategories && subcategories.length > 0) {
      const subcategoryIds = subcategories.map((sub) => sub.id)

      // Delete all goals in these subcategories
      const { error: goalsDeleteError } = await supabase.from("goals").delete().in("subcategory_id", subcategoryIds)

      if (goalsDeleteError) {
        console.error("Error deleting goals:", goalsDeleteError)
        return { success: false, error: goalsDeleteError.message }
      }

      // Delete all subcategories
      const { error: subcategoriesDeleteError } = await supabase
        .from("goal_subcategories")
        .delete()
        .eq("category_id", categoryId)

      if (subcategoriesDeleteError) {
        console.error("Error deleting subcategories:", subcategoriesDeleteError)
        return { success: false, error: subcategoriesDeleteError.message }
      }
    }

    // Finally, delete the category
    const { error } = await supabase.from("goal_categories").delete().eq("id", categoryId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting category:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting category:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Subcategories
export async function createSubcategory(
  userId: string,
  subcategory: Partial<GoalSubcategory>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("goal_subcategories")
      .insert({
        name: subcategory.name,
        description: subcategory.description || "",
        category_id: subcategory.category_id,
        user_id: userId,
        daily_time_allocation: subcategory.daily_time_allocation || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating subcategory:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Unexpected error creating subcategory:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function updateSubcategory(
  userId: string,
  subcategoryId: string,
  updates: Partial<GoalSubcategory>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("goal_subcategories")
      .update({
        name: updates.name,
        description: updates.description,
        category_id: updates.category_id,
        daily_time_allocation: updates.daily_time_allocation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subcategoryId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating subcategory:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error updating subcategory:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function deleteSubcategory(
  userId: string,
  subcategoryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // First, delete all goals in this subcategory
    const { error: goalsDeleteError } = await supabase.from("goals").delete().eq("subcategory_id", subcategoryId)

    if (goalsDeleteError) {
      console.error("Error deleting goals:", goalsDeleteError)
      return { success: false, error: goalsDeleteError.message }
    }

    // Then delete the subcategory
    const { error } = await supabase.from("goal_subcategories").delete().eq("id", subcategoryId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting subcategory:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting subcategory:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Goals
export async function createGoal(
  userId: string,
  goal: Partial<Goal>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("goals")
      .insert({
        name: goal.name,
        description: goal.description || "",
        notes: goal.notes || "",
        subcategory_id: goal.subcategory_id,
        user_id: userId,
        daily_time_allocation: goal.daily_time_allocation || 0,
        progress: goal.progress || 0,
        status: goal.status || "not_started",
        priority: goal.priority || "medium",
        due_date: goal.due_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating goal:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Unexpected error creating goal:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function updateGoal(
  userId: string,
  goalId: string,
  updates: Partial<Goal>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("goals")
      .update({
        name: updates.name,
        description: updates.description,
        notes: updates.notes,
        subcategory_id: updates.subcategory_id,
        daily_time_allocation: updates.daily_time_allocation,
        progress: updates.progress,
        status: updates.status,
        priority: updates.priority,
        due_date: updates.due_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating goal:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error updating goal:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function deleteGoal(userId: string, goalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // Delete all time entries for this goal
    const { error: timeEntriesDeleteError } = await supabase.from("time_entries").delete().eq("goal_id", goalId)

    if (timeEntriesDeleteError) {
      console.error("Error deleting time entries:", timeEntriesDeleteError)
      return { success: false, error: timeEntriesDeleteError.message }
    }

    // Delete the goal
    const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting goal:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting goal:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Time entries
export async function addTimeEntry(
  userId: string,
  entry: Partial<TimeEntry>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        goal_id: entry.goal_id,
        user_id: userId,
        duration: entry.duration,
        date: entry.date || new Date().toISOString().split("T")[0],
        notes: entry.notes || "",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error adding time entry:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    revalidatePath("/dashboard")
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Unexpected error adding time entry:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Move operations
export async function moveGoal(
  userId: string,
  goalId: string,
  newSubcategoryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("goals")
      .update({
        subcategory_id: newSubcategoryId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error moving goal:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error moving goal:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function moveSubcategory(
  userId: string,
  subcategoryId: string,
  newCategoryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("goal_subcategories")
      .update({
        category_id: newCategoryId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subcategoryId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error moving subcategory:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/goals")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error moving subcategory:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

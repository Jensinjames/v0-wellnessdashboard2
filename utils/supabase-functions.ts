import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { WellnessEntry, WellnessCategory, CategoryType } from "@/types/wellness"

/**
 * Get dashboard data for the current user
 */
export async function getDashboardData(
  userId: string,
  timeframe: "day" | "week" | "month" | "year" = "week",
  limit = 50,
) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.rpc("get_dashboard_data", {
      p_user_id: userId,
      p_timeframe: timeframe,
      p_limit: limit,
    })

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch dashboard data",
    }
  }
}

/**
 * Update or create a wellness goal
 */
export async function updateWellnessGoal(userId: string, category: CategoryType, goalHours: number, notes?: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.rpc("update_wellness_goal", {
      p_user_id: userId,
      p_category: category,
      p_goal_hours: goalHours,
      p_notes: notes,
    })

    if (error) throw error

    return data as { success: boolean; data?: any; error?: string }
  } catch (error: any) {
    console.error("Error updating wellness goal:", error)
    return {
      success: false,
      error: error.message || "Failed to update goal",
    }
  }
}

/**
 * Add a wellness entry
 */
export async function addWellnessEntry(
  userId: string,
  entry: {
    category: string
    activity: string
    duration: number
    notes?: string
    timestamp?: string
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.rpc("add_wellness_entry", {
      p_user_id: userId,
      p_category: entry.category,
      p_activity: entry.activity,
      p_duration: entry.duration,
      p_notes: entry.notes,
      p_timestamp: entry.timestamp,
    })

    if (error) throw error

    return data as { success: boolean; data?: WellnessEntry; error?: string }
  } catch (error: any) {
    console.error("Error adding wellness entry:", error)
    return {
      success: false,
      error: error.message || "Failed to add entry",
    }
  }
}

/**
 * Manage wellness categories (create, update, delete)
 */
export async function manageWellnessCategory(
  userId: string,
  action: "create" | "update" | "delete",
  categoryData: Partial<WellnessCategory>,
) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.rpc("manage_wellness_category", {
      p_user_id: userId,
      p_action: action,
      p_category_data: categoryData,
    })

    if (error) throw error

    return data as { success: boolean; data?: WellnessCategory; action?: string; error?: string }
  } catch (error: any) {
    console.error(`Error ${action}ing wellness category:`, error)
    return {
      success: false,
      error: error.message || `Failed to ${action} category`,
    }
  }
}

/**
 * Get user progress summary
 */
export async function getUserProgressSummary(userId: string, timeframe: "day" | "week" | "month" | "year" = "week") {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.rpc("get_user_progress_summary", {
      p_user_id: userId,
      p_timeframe: timeframe,
    })

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error("Error fetching user progress summary:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch progress summary",
    }
  }
}

/**
 * Manage goal hierarchy (categories, subcategories, goals, time entries)
 */
export async function manageGoalHierarchy(
  userId: string,
  action:
    | "create_category"
    | "update_category"
    | "delete_category"
    | "create_subcategory"
    | "update_subcategory"
    | "delete_subcategory"
    | "create_goal"
    | "update_goal"
    | "delete_goal"
    | "add_time_entry",
  data: any,
) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: result, error } = await supabase.rpc("manage_goal_hierarchy", {
      p_user_id: userId,
      p_action: action,
      p_data: data,
    })

    if (error) throw error

    return result as {
      success: boolean
      data?: any
      action?: string
      error?: string
      code?: string
    }
  } catch (error: any) {
    console.error(`Error executing ${action}:`, error)
    return {
      success: false,
      error: error.message || `Failed to execute ${action}`,
    }
  }
}

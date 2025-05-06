"use server"

import { getSupabaseAdmin } from "@/lib/supabase-client"
import type { WellnessCategory, WellnessEntry, WellnessGoal, WellnessMetric } from "@/types/supabase"
import { revalidatePath } from "next/cache"

// Ensure this is a server action
export async function getWellnessData(userId: string) {
  // Double-check we're on the server
  if (typeof window !== "undefined") {
    throw new Error("This function must be called on the server")
  }

  try {
    const supabase = getSupabaseAdmin()

    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from("wellness_categories")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true })

    if (categoriesError) throw categoriesError

    // Get today's entries
    const today = new Date().toISOString().split("T")[0]
    const { data: entries, error: entriesError } = await supabase
      .from("wellness_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", today)

    if (entriesError) throw entriesError

    // Get active goals
    const { data: goals, error: goalsError } = await supabase
      .from("wellness_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (goalsError) throw goalsError

    // Get today's metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("wellness_metrics")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", today)
      .maybeSingle()

    if (metricsError) throw metricsError

    // Get recent entries for history
    const { data: recentEntries, error: recentEntriesError } = await supabase
      .from("wellness_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10)

    if (recentEntriesError) throw recentEntriesError

    return {
      success: true,
      categories: categories as WellnessCategory[],
      entries: entries as WellnessEntry[],
      goals: goals as WellnessGoal[],
      metrics: metrics as WellnessMetric | null,
      recentEntries: recentEntries as WellnessEntry[],
    }
  } catch (error) {
    console.error("Error fetching wellness data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      categories: [],
      entries: [],
      goals: [],
      metrics: null,
      recentEntries: [],
    }
  }
}

// Ensure this is a server action
export async function createDefaultCategories(userId: string) {
  // Double-check we're on the server
  if (typeof window !== "undefined") {
    throw new Error("This function must be called on the server")
  }

  try {
    const supabase = getSupabaseAdmin()

    // Check if user already has categories
    const { data: existingCategories, error: checkError } = await supabase
      .from("wellness_categories")
      .select("id")
      .eq("user_id", userId)
      .limit(1)

    if (checkError) throw checkError

    // If user already has categories, don't create defaults
    if (existingCategories && existingCategories.length > 0) {
      return {
        success: true,
        message: "User already has categories",
      }
    }

    // Default categories
    const defaultCategories = [
      {
        user_id: userId,
        name: "Faith",
        description: "Spiritual wellness activities",
        color: "#8b5cf6", // violet-500
        icon: "heart",
        display_order: 0,
      },
      {
        user_id: userId,
        name: "Life",
        description: "Personal and social wellness activities",
        color: "#3b82f6", // blue-500
        icon: "users",
        display_order: 1,
      },
      {
        user_id: userId,
        name: "Work",
        description: "Professional and productivity activities",
        color: "#ef4444", // red-500
        icon: "briefcase",
        display_order: 2,
      },
      {
        user_id: userId,
        name: "Health",
        description: "Physical and mental health activities",
        color: "#10b981", // emerald-500
        icon: "activity",
        display_order: 3,
      },
    ]

    // Insert default categories
    const { error: insertError } = await supabase.from("wellness_categories").insert(defaultCategories)

    if (insertError) throw insertError

    // Create default goals
    const { data: categories, error: fetchError } = await supabase
      .from("wellness_categories")
      .select("*")
      .eq("user_id", userId)

    if (fetchError) throw fetchError

    const defaultGoals = categories.map((category) => ({
      user_id: userId,
      category_id: category.id,
      activity_id: null,
      target_minutes:
        category.name === "Faith"
          ? 90
          : category.name === "Life"
            ? 240
            : category.name === "Work"
              ? 420
              : category.name === "Health"
                ? 120
                : 60,
      target_frequency: "daily",
      start_date: new Date().toISOString().split("T")[0],
      is_active: true,
    }))

    const { error: goalsError } = await supabase.from("wellness_goals").insert(defaultGoals)

    if (goalsError) throw goalsError

    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Default categories and goals created",
    }
  } catch (error) {
    console.error("Error creating default categories:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function logWellnessEntry(
  userId: string,
  categoryId: string,
  activityId: string | null,
  minutes: number,
  notes: string | null = null,
) {
  // Double-check we're on the server
  if (typeof window !== "undefined") {
    throw new Error("This function must be called on the server")
  }

  try {
    const supabase = getSupabaseAdmin()

    const today = new Date().toISOString().split("T")[0]

    const entry = {
      user_id: userId,
      category_id: categoryId,
      activity_id: activityId,
      entry_date: today,
      minutes_spent: minutes,
      notes,
    }

    const { data, error } = await supabase.from("wellness_entries").insert([entry]).select().single()

    if (error) throw error

    revalidatePath("/dashboard")

    return {
      success: true,
      entry: data,
    }
  } catch (error) {
    console.error("Error logging wellness entry:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function updateDailyMetrics(
  userId: string,
  metrics: {
    motivation_level?: number
    sleep_hours?: number
    daily_score?: number
    notes?: string
  },
) {
  // Double-check we're on the server
  if (typeof window !== "undefined") {
    throw new Error("This function must be called on the server")
  }

  try {
    const supabase = getSupabaseAdmin()

    const today = new Date().toISOString().split("T")[0]

    // Check if metrics exist for today
    const { data: existingMetrics, error: checkError } = await supabase
      .from("wellness_metrics")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", today)
      .maybeSingle()

    if (checkError) throw checkError

    let result

    if (existingMetrics) {
      // Update existing metrics
      const { data, error } = await supabase
        .from("wellness_metrics")
        .update(metrics)
        .eq("id", existingMetrics.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert new metrics
      const { data, error } = await supabase
        .from("wellness_metrics")
        .insert([
          {
            user_id: userId,
            entry_date: today,
            ...metrics,
          },
        ])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    revalidatePath("/dashboard")

    return {
      success: true,
      metrics: result,
    }
  } catch (error) {
    console.error("Error updating daily metrics:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

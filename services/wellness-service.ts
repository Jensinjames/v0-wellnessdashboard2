import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

type WellnessEntriesRow = Database["public"]["Tables"]["wellness_entries"]["Row"]
type WellnessGoalsRow = Database["public"]["Tables"]["wellness_goals"]["Row"]

// Create a singleton instance of the Supabase client for client-side usage
const supabase = getSupabaseClient()

export async function getUserEntries(userId: string): Promise<WellnessEntriesRow[]> {
  const { data, error } = await supabase
    .from("wellness_entries")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })

  if (error) {
    console.error("Error fetching wellness entries:", error)
    throw error
  }

  return data || []
}

export async function getUserGoals(userId: string): Promise<WellnessGoalsRow[]> {
  const { data, error } = await supabase.from("wellness_goals").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error fetching wellness goals:", error)
    throw error
  }

  return data || []
}

export async function addWellnessEntry(
  entry: Omit<WellnessEntriesRow, "id" | "created_at">,
): Promise<WellnessEntriesRow> {
  const { data, error } = await supabase.from("wellness_entries").insert(entry).select().single()

  if (error) {
    console.error("Error adding wellness entry:", error)
    throw error
  }

  return data
}

export async function updateWellnessEntry(
  id: string,
  updates: Partial<Omit<WellnessEntriesRow, "id" | "created_at">>,
): Promise<WellnessEntriesRow> {
  const { data, error } = await supabase.from("wellness_entries").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating wellness entry:", error)
    throw error
  }

  return data
}

export async function deleteWellnessEntry(id: string): Promise<void> {
  const { error } = await supabase.from("wellness_entries").delete().eq("id", id)

  if (error) {
    console.error("Error deleting wellness entry:", error)
    throw error
  }
}

export async function setWellnessGoal(
  goal: Omit<WellnessGoalsRow, "id" | "created_at" | "updated_at">,
): Promise<WellnessGoalsRow> {
  // First check if a goal for this category already exists
  const { data: existingGoals } = await supabase
    .from("wellness_goals")
    .select("*")
    .eq("user_id", goal.user_id)
    .eq("category", goal.category)

  if (existingGoals && existingGoals.length > 0) {
    // Update existing goal
    const { data, error } = await supabase
      .from("wellness_goals")
      .update({
        goal_hours: goal.goal_hours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingGoals[0].id)
      .select()
      .single()

    if (error) {
      console.error("Error updating wellness goal:", error)
      throw error
    }

    return data
  } else {
    // Insert new goal
    const { data, error } = await supabase.from("wellness_goals").insert(goal).select().single()

    if (error) {
      console.error("Error adding wellness goal:", error)
      throw error
    }

    return data
  }
}

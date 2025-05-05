import { getSupabaseClient } from "@/lib/supabase-client"
import type { WellnessCategory, WellnessEntryData, WellnessGoal } from "@/types/wellness"

// Default user ID for demo purposes
const DEFAULT_USER_ID = "310bdb78-46ed-46bf-9d43-f8b719fa9d20"

// Fetch wellness categories
export async function fetchWellnessCategories(userId = DEFAULT_USER_ID): Promise<WellnessCategory[]> {
  const supabase = getSupabaseClient()

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("wellness_categories")
    .select("*")
    .eq("user_id", userId)

  if (categoriesError) {
    console.error("Error fetching wellness categories:", categoriesError)
    throw categoriesError
  }

  // Transform to match our WellnessCategory type
  // Note: We'll need to add the metrics separately
  const categories: Partial<WellnessCategory>[] = categoriesData.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.name, // Using name as description since we don't have a description field
    icon: cat.icon || "Activity",
    color: cat.color || "gray",
    enabled: true,
    metrics: [], // Will be populated later
  }))

  return categories as WellnessCategory[]
}

// Fetch wellness goals
export async function fetchWellnessGoals(userId = DEFAULT_USER_ID): Promise<WellnessGoal[]> {
  const supabase = getSupabaseClient()

  const { data: goalsData, error: goalsError } = await supabase.from("wellness_goals").select("*").eq("user_id", userId)

  if (goalsError) {
    console.error("Error fetching wellness goals:", goalsError)
    throw goalsError
  }

  // Transform to match our WellnessGoal type
  const goals: WellnessGoal[] = goalsData.map((goal) => ({
    categoryId: goal.category,
    metricId: goal.category.toLowerCase(), // Using category as metricId for now
    value: goal.goal_hours,
  }))

  return goals
}

// Fetch wellness entries
export async function fetchWellnessEntries(userId = DEFAULT_USER_ID): Promise<WellnessEntryData[]> {
  const supabase = getSupabaseClient()

  const { data: entriesData, error: entriesError } = await supabase
    .from("wellness_entries")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })

  if (entriesError) {
    console.error("Error fetching wellness entries:", entriesError)
    throw entriesError
  }

  // Group entries by date
  const entriesByDate = entriesData.reduce(
    (acc, entry) => {
      const date = new Date(entry.timestamp).toISOString().split("T")[0]

      if (!acc[date]) {
        acc[date] = {
          id: date,
          date: new Date(date),
          metrics: [],
        }
      }

      acc[date].metrics.push({
        categoryId: entry.category,
        metricId: entry.activity.toLowerCase().replace(/\s+/g, ""),
        value: entry.duration,
      })

      return acc
    },
    {} as Record<string, WellnessEntryData>,
  )

  return Object.values(entriesByDate)
}

// Create a new wellness entry
export async function createWellnessEntry(entry: {
  category: string
  activity: string
  duration: number
  notes?: string
  userId?: string
}): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("wellness_entries").insert({
    id: crypto.randomUUID(),
    user_id: entry.userId || DEFAULT_USER_ID,
    category: entry.category,
    activity: entry.activity,
    duration: entry.duration,
    notes: entry.notes || "",
    timestamp: new Date().toISOString(),
  })

  if (error) {
    console.error("Error creating wellness entry:", error)
    throw error
  }
}

// Update a wellness goal
export async function updateWellnessGoal(goal: {
  category: string
  goal_hours: number
  userId?: string
}): Promise<void> {
  const supabase = getSupabaseClient()

  // Check if goal exists
  const { data: existingGoal } = await supabase
    .from("wellness_goals")
    .select("id")
    .eq("category", goal.category)
    .eq("user_id", goal.userId || DEFAULT_USER_ID)
    .single()

  if (existingGoal) {
    // Update existing goal
    const { error } = await supabase
      .from("wellness_goals")
      .update({
        goal_hours: goal.goal_hours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingGoal.id)

    if (error) {
      console.error("Error updating wellness goal:", error)
      throw error
    }
  } else {
    // Create new goal
    const { error } = await supabase.from("wellness_goals").insert({
      id: crypto.randomUUID(),
      user_id: goal.userId || DEFAULT_USER_ID,
      category: goal.category,
      goal_hours: goal.goal_hours,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating wellness goal:", error)
      throw error
    }
  }
}

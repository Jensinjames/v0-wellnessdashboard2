import { getServerDb, handleDbError, logDbOperation, type DbResult, validateInput } from "./db-utils"
import { z } from "zod"
import type { Database } from "@/types/supabase"

// Type for goal
export type Goal = Database["public"]["Tables"]["goals"]["Row"]

// Schema for goal creation
const goalSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  target_duration: z.number().int().positive("Target duration must be a positive number"),
  timeframe: z.enum(["daily", "weekly", "monthly", "yearly"], {
    errorMap: () => ({ message: "Timeframe must be one of: daily, weekly, monthly, yearly" }),
  }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  target_value: z.number().optional(),
  description: z.string().optional(),
})

export type GoalCreate = z.infer<typeof goalSchema>
export type GoalUpdate = Partial<GoalCreate>

/**
 * Get all goals for a user
 */
export async function getUserGoals(userId: string): Promise<DbResult<Goal[]>> {
  try {
    logDbOperation("getUserGoals", { userId })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "getUserGoals" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error: handleDbError(error, "getUserGoals") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getUserGoals") }
  }
}

/**
 * Get goals for a specific category
 */
export async function getCategoryGoals(categoryId: string, userId: string): Promise<DbResult<Goal[]>> {
  try {
    logDbOperation("getCategoryGoals", { categoryId, userId })

    // Input validation
    if (!categoryId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Category ID and User ID are required",
          details: null,
          operation: "getCategoryGoals",
        },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("category_id", categoryId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error: handleDbError(error, "getCategoryGoals") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getCategoryGoals") }
  }
}

/**
 * Get a goal by ID
 */
export async function getGoalById(goalId: string, userId: string): Promise<DbResult<Goal>> {
  try {
    logDbOperation("getGoalById", { goalId, userId })

    // Input validation
    if (!goalId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Goal ID and User ID are required",
          details: null,
          operation: "getGoalById",
        },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase.from("goals").select("*").eq("id", goalId).eq("user_id", userId).single()

    if (error) {
      return { data: null, error: handleDbError(error, "getGoalById") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getGoalById") }
  }
}

/**
 * Create a new goal
 */
export async function createGoal(goal: GoalCreate, userId: string): Promise<DbResult<Goal>> {
  try {
    logDbOperation("createGoal", { goal, userId })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "createGoal" },
      }
    }

    const validation = validateInput(goal, goalSchema)
    if (validation.error) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "createGoal" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("goals")
      .insert({
        ...validation.data,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "createGoal") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "createGoal") }
  }
}

/**
 * Update a goal
 */
export async function updateGoal(goalId: string, goal: GoalUpdate, userId: string): Promise<DbResult<Goal>> {
  try {
    logDbOperation("updateGoal", { goalId, goal, userId })

    // Input validation
    if (!goalId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Goal ID and User ID are required",
          details: null,
          operation: "updateGoal",
        },
      }
    }

    // Partial validation for update
    const partialSchema = goalSchema.partial()
    const validation = validateInput(goal, partialSchema)
    if (validation.error) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "updateGoal" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("goals")
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "updateGoal") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "updateGoal") }
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string, userId: string): Promise<DbResult<null>> {
  try {
    logDbOperation("deleteGoal", { goalId, userId })

    // Input validation
    if (!goalId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Goal ID and User ID are required",
          details: null,
          operation: "deleteGoal",
        },
      }
    }

    const supabase = getServerDb()
    const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("user_id", userId)

    if (error) {
      return { data: null, error: handleDbError(error, "deleteGoal") }
    }

    return { data: null, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "deleteGoal") }
  }
}

/**
 * Get goal progress
 */
export async function getGoalProgress(goalId: string, userId: string): Promise<DbResult<any>> {
  try {
    logDbOperation("getGoalProgress", { goalId, userId })

    // Input validation
    if (!goalId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Goal ID and User ID are required",
          details: null,
          operation: "getGoalProgress",
        },
      }
    }

    const supabase = getServerDb()

    // First get the goal details
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", userId)
      .single()

    if (goalError) {
      return { data: null, error: handleDbError(goalError, "getGoalProgress") }
    }

    // Then get the entries for this category within the goal timeframe
    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("duration")
      .eq("category_id", goal.category_id)
      .eq("user_id", userId)
      .gte("date", goal.start_date)
      .lte("date", goal.end_date || new Date().toISOString().split("T")[0])

    if (entriesError) {
      return { data: null, error: handleDbError(entriesError, "getGoalProgress") }
    }

    // Calculate total duration
    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)

    // Calculate progress percentage
    const progressPercentage = Math.min(100, Math.round((totalDuration / goal.target_duration) * 100))

    return {
      data: {
        goal,
        totalDuration,
        progressPercentage,
        remainingDuration: Math.max(0, goal.target_duration - totalDuration),
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getGoalProgress") }
  }
}

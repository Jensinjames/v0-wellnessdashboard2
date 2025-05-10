"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import { useAuth } from "@/context/auth-context"
import type { CategoryGoal } from "@/types/wellness"
import { CACHE_EXPIRY } from "@/lib/query-cache"

export function useGoals() {
  const { user } = useAuth()
  const { read, write, isOnline } = useSupabase()
  const [goals, setGoals] = useState<CategoryGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch goals with selective columns and join with categories
  const fetchGoals = useCallback(
    async (refresh = false) => {
      if (!user) {
        setError("You must be logged in to view goals")
        setIsLoading(false)
        return []
      }

      setIsLoading(true)
      setError(null)

      try {
        // First get the goals
        const goalsData = await read<any[]>("wellness_goals", (query) => query.eq("user_id", user.id), {
          columns: ["id", "category", "goal_hours"],
          cacheKey: `goals:${user.id}`,
          cacheTTL: CACHE_EXPIRY.MEDIUM,
          bypassCache: refresh,
          requiresAuth: true,
        })

        // Then get the categories for colors and names
        const categories = await read<any[]>("wellness_categories", (query) => query.select("id, name, color"), {
          cacheKey: "categories:colors",
          cacheTTL: CACHE_EXPIRY.LONG,
          bypassCache: refresh,
        })

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
        const transformedGoals = goalsData.map((goal) => {
          const category = goal.category
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

        setGoals(transformedGoals)
        return transformedGoals
      } catch (err: any) {
        console.error("Error fetching goals:", err)
        setError(err.message || "Failed to load goals")
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [user, read, isOnline],
  )

  // Update or create a goal
  const updateGoal = useCallback(
    async (goal: Partial<CategoryGoal>) => {
      if (!user || !goal.category) {
        return { success: false, error: "Invalid goal data" }
      }

      try {
        // Check if goal exists
        const existingGoal = await read<{ id: string } | null>(
          "wellness_goals",
          (query) => query.eq("user_id", user.id).eq("category", goal.category).limit(1).maybeSingle(),
          {
            columns: ["id"],
            bypassCache: true,
          },
        )

        if (existingGoal) {
          // Update existing goal
          await write(
            "wellness_goals",
            "update",
            {
              goal_hours: goal.goal_hours,
              updated_at: new Date().toISOString(),
            },
            (query) => query.eq("id", existingGoal.id),
            {
              requiresAuth: true,
            },
          )
        } else {
          // Create new goal
          await write(
            "wellness_goals",
            "insert",
            {
              user_id: user.id,
              category: goal.category,
              goal_hours: goal.goal_hours,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            (query) => query,
            {
              requiresAuth: true,
            },
          )
        }

        // Refresh goals
        await fetchGoals(true)

        return { success: true }
      } catch (error: any) {
        console.error("Error updating goal:", error)
        return { success: false, error: error.message || "An unexpected error occurred" }
      }
    },
    [user, read, write, fetchGoals],
  )

  // Delete a goal
  const deleteGoal = useCallback(
    async (goalId: string) => {
      if (!user) {
        return { success: false, error: "You must be logged in" }
      }

      try {
        await write("wellness_goals", "delete", null, (query) => query.eq("id", goalId).eq("user_id", user.id), {
          requiresAuth: true,
        })

        // Refresh goals
        await fetchGoals(true)

        return { success: true }
      } catch (error: any) {
        console.error("Error deleting goal:", error)
        return { success: false, error: error.message || "An unexpected error occurred" }
      }
    },
    [user, write, fetchGoals],
  )

  // Load goals on mount
  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user, fetchGoals])

  return {
    goals,
    isLoading,
    error,
    fetchGoals,
    updateGoal,
    deleteGoal,
  }
}

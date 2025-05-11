"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import type { GoalHierarchy, Category, Subcategory, Goal, TimeEntry } from "@/types/goals-hierarchy"

export function useGoalHierarchy() {
  const { supabase, query, isInitialized } = useSupabase()
  const [hierarchy, setHierarchy] = useState<GoalHierarchy>({
    categories: [],
    subcategories: [],
    goals: [],
    timeEntries: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch all data
  const fetchHierarchy = useCallback(async () => {
    if (!isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch categories
      const categories = await query<Category[]>(
        async (client) => {
          const { data, error } = await client.from("categories").select("*").order("order")

          if (error) throw error
          return data || []
        },
        { requiresAuth: true },
      )

      // Fetch subcategories
      const subcategories = await query<Subcategory[]>(
        async (client) => {
          const { data, error } = await client.from("subcategories").select("*").order("order")

          if (error) throw error
          return data || []
        },
        { requiresAuth: true },
      )

      // Fetch goals
      const goals = await query<Goal[]>(
        async (client) => {
          const { data, error } = await client.from("goals").select("*").order("priority")

          if (error) throw error
          return data || []
        },
        { requiresAuth: true },
      )

      // Fetch time entries
      const timeEntries = await query<TimeEntry[]>(
        async (client) => {
          const { data, error } = await client
            .from("time_entries")
            .select("*")
            .order("start_time", { ascending: false })

          if (error) throw error
          return data || []
        },
        { requiresAuth: true },
      )

      setHierarchy({
        categories,
        subcategories,
        goals,
        timeEntries,
      })
    } catch (err) {
      console.error("Error fetching goal hierarchy:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch goal hierarchy"))
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized, query])

  // Add a new category
  const addCategory = useCallback(
    async (category: Omit<Category, "id">) => {
      if (!supabase) return null

      try {
        const { data, error } = await supabase.from("categories").insert(category).select().single()

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          categories: [...prev.categories, data],
        }))

        return data
      } catch (err) {
        console.error("Error adding category:", err)
        throw err
      }
    },
    [supabase],
  )

  // Add a new subcategory
  const addSubcategory = useCallback(
    async (subcategory: Omit<Subcategory, "id">) => {
      if (!supabase) return null

      try {
        const { data, error } = await supabase.from("subcategories").insert(subcategory).select().single()

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          subcategories: [...prev.subcategories, data],
        }))

        return data
      } catch (err) {
        console.error("Error adding subcategory:", err)
        throw err
      }
    },
    [supabase],
  )

  // Add a new goal
  const addGoal = useCallback(
    async (goal: Omit<Goal, "id">) => {
      if (!supabase) return null

      try {
        const { data, error } = await supabase.from("goals").insert(goal).select().single()

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          goals: [...prev.goals, data],
        }))

        return data
      } catch (err) {
        console.error("Error adding goal:", err)
        throw err
      }
    },
    [supabase],
  )

  // Add a new time entry
  const addTimeEntry = useCallback(
    async (timeEntry: Omit<TimeEntry, "id">) => {
      if (!supabase) return null

      try {
        const { data, error } = await supabase.from("time_entries").insert(timeEntry).select().single()

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          timeEntries: [data, ...prev.timeEntries],
        }))

        return data
      } catch (err) {
        console.error("Error adding time entry:", err)
        throw err
      }
    },
    [supabase],
  )

  // Update a category
  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("categories").update(updates).eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          categories: prev.categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
        }))

        return true
      } catch (err) {
        console.error("Error updating category:", err)
        throw err
      }
    },
    [supabase],
  )

  // Update a subcategory
  const updateSubcategory = useCallback(
    async (id: string, updates: Partial<Subcategory>) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("subcategories").update(updates).eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          subcategories: prev.subcategories.map((subcat) => (subcat.id === id ? { ...subcat, ...updates } : subcat)),
        }))

        return true
      } catch (err) {
        console.error("Error updating subcategory:", err)
        throw err
      }
    },
    [supabase],
  )

  // Update a goal
  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("goals").update(updates).eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          goals: prev.goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)),
        }))

        return true
      } catch (err) {
        console.error("Error updating goal:", err)
        throw err
      }
    },
    [supabase],
  )

  // Update a time entry
  const updateTimeEntry = useCallback(
    async (id: string, updates: Partial<TimeEntry>) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("time_entries").update(updates).eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          timeEntries: prev.timeEntries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
        }))

        return true
      } catch (err) {
        console.error("Error updating time entry:", err)
        throw err
      }
    },
    [supabase],
  )

  // Delete a category
  const deleteCategory = useCallback(
    async (id: string) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("categories").delete().eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          categories: prev.categories.filter((cat) => cat.id !== id),
        }))

        return true
      } catch (err) {
        console.error("Error deleting category:", err)
        throw err
      }
    },
    [supabase],
  )

  // Delete a subcategory
  const deleteSubcategory = useCallback(
    async (id: string) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("subcategories").delete().eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          subcategories: prev.subcategories.filter((subcat) => subcat.id !== id),
        }))

        return true
      } catch (err) {
        console.error("Error deleting subcategory:", err)
        throw err
      }
    },
    [supabase],
  )

  // Delete a goal
  const deleteGoal = useCallback(
    async (id: string) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("goals").delete().eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          goals: prev.goals.filter((goal) => goal.id !== id),
        }))

        return true
      } catch (err) {
        console.error("Error deleting goal:", err)
        throw err
      }
    },
    [supabase],
  )

  // Delete a time entry
  const deleteTimeEntry = useCallback(
    async (id: string) => {
      if (!supabase) return false

      try {
        const { error } = await supabase.from("time_entries").delete().eq("id", id)

        if (error) throw error

        setHierarchy((prev) => ({
          ...prev,
          timeEntries: prev.timeEntries.filter((entry) => entry.id !== id),
        }))

        return true
      } catch (err) {
        console.error("Error deleting time entry:", err)
        throw err
      }
    },
    [supabase],
  )

  // Get subcategories for a specific category
  const getSubcategoriesForCategory = useCallback(
    (categoryId: string) => {
      return hierarchy.subcategories.filter((subcat) => subcat.category_id === categoryId)
    },
    [hierarchy.subcategories],
  )

  // Get goals for a specific subcategory
  const getGoalsForSubcategory = useCallback(
    (subcategoryId: string) => {
      return hierarchy.goals.filter((goal) => goal.subcategory_id === subcategoryId)
    },
    [hierarchy.goals],
  )

  // Get time entries for a specific goal
  const getTimeEntriesForGoal = useCallback(
    (goalId: string) => {
      return hierarchy.timeEntries.filter((entry) => entry.goal_id === goalId)
    },
    [hierarchy.timeEntries],
  )

  // Get all time entries for a specific category
  const getTimeEntriesForCategory = useCallback(
    (categoryId: string) => {
      const subcategoryIds = hierarchy.subcategories
        .filter((subcat) => subcat.category_id === categoryId)
        .map((subcat) => subcat.id)

      const goalIds = hierarchy.goals
        .filter((goal) => subcategoryIds.includes(goal.subcategory_id))
        .map((goal) => goal.id)

      return hierarchy.timeEntries.filter((entry) => goalIds.includes(entry.goal_id))
    },
    [hierarchy],
  )

  // Get total time spent on a goal
  const getTotalTimeForGoal = useCallback(
    (goalId: string) => {
      return hierarchy.timeEntries
        .filter((entry) => entry.goal_id === goalId)
        .reduce((total, entry) => {
          const duration = entry.end_time
            ? new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()
            : 0
          return total + duration
        }, 0)
    },
    [hierarchy.timeEntries],
  )

  // Get total time spent on a subcategory
  const getTotalTimeForSubcategory = useCallback(
    (subcategoryId: string) => {
      const goalIds = hierarchy.goals.filter((goal) => goal.subcategory_id === subcategoryId).map((goal) => goal.id)

      return hierarchy.timeEntries
        .filter((entry) => goalIds.includes(entry.goal_id))
        .reduce((total, entry) => {
          const duration = entry.end_time
            ? new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()
            : 0
          return total + duration
        }, 0)
    },
    [hierarchy],
  )

  // Get total time spent on a category
  const getTotalTimeForCategory = useCallback(
    (categoryId: string) => {
      const subcategoryIds = hierarchy.subcategories
        .filter((subcat) => subcat.category_id === categoryId)
        .map((subcat) => subcat.id)

      const goalIds = hierarchy.goals
        .filter((goal) => subcategoryIds.includes(goal.subcategory_id))
        .map((goal) => goal.id)

      return hierarchy.timeEntries
        .filter((entry) => goalIds.includes(entry.goal_id))
        .reduce((total, entry) => {
          const duration = entry.end_time
            ? new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()
            : 0
          return total + duration
        }, 0)
    },
    [hierarchy],
  )

  // Load data on initial mount
  useEffect(() => {
    if (isInitialized) {
      fetchHierarchy()
    }
  }, [isInitialized, fetchHierarchy])

  return {
    hierarchy,
    isLoading,
    error,
    fetchHierarchy,
    addCategory,
    addSubcategory,
    addGoal,
    addTimeEntry,
    updateCategory,
    updateSubcategory,
    updateGoal,
    updateTimeEntry,
    deleteCategory,
    deleteSubcategory,
    deleteGoal,
    deleteTimeEntry,
    getSubcategoriesForCategory,
    getGoalsForSubcategory,
    getTimeEntriesForGoal,
    getTimeEntriesForCategory,
    getTotalTimeForGoal,
    getTotalTimeForSubcategory,
    getTotalTimeForCategory,
  }
}

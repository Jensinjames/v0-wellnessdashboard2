"use client"

import { useState, useEffect, useCallback } from "react"
import { useOptimizedSupabase } from "@/hooks/use-optimized-supabase"
import { getOptimisticUpdates } from "@/lib/optimistic-updates"
import type { WellnessEntry, WellnessCategory, CategoryGoal } from "@/types/wellness"

export function useOptimisticWellness() {
  const { client } = useOptimizedSupabase()
  const optimistic = getOptimisticUpdates()
  const [isListening, setIsListening] = useState(false)

  // Function to apply optimistic updates to entries
  const applyOptimisticEntries = useCallback(
    (entries: WellnessEntry[]): WellnessEntry[] => {
      return optimistic.applyUpdates<WellnessEntry>("wellness_entries", entries)
    },
    [optimistic],
  )

  // Function to create an optimistic entry
  const addOptimisticEntry = useCallback(
    (entry: Omit<WellnessEntry, "id" | "created_at">): WellnessEntry => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const timestamp = new Date().toISOString()

      const optimisticEntry: WellnessEntry = {
        id: tempId,
        created_at: timestamp,
        updated_at: timestamp,
        ...entry,
        __optimistic: true,
      } as WellnessEntry

      // Create the optimistic update
      optimistic.createOptimisticInsert("wellness_entries", optimisticEntry)

      return optimisticEntry
    },
    [optimistic],
  )

  // Function to delete an entry optimistically
  const deleteOptimisticEntry = useCallback(
    (entryId: string, originalEntry?: WellnessEntry): void => {
      optimistic.createOptimisticDelete("wellness_entries", entryId, originalEntry)
    },
    [optimistic],
  )

  // Function to create an optimistic category
  const addOptimisticCategory = useCallback(
    (category: Omit<WellnessCategory, "id" | "created_at">): WellnessCategory => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const timestamp = new Date().toISOString()

      const optimisticCategory: WellnessCategory = {
        id: tempId,
        created_at: timestamp,
        updated_at: timestamp,
        ...category,
        __optimistic: true,
      } as WellnessCategory

      // Create the optimistic update
      optimistic.createOptimisticInsert("wellness_categories", optimisticCategory)

      return optimisticCategory
    },
    [optimistic],
  )

  // Function to update a category optimistically
  const updateOptimisticCategory = useCallback(
    (categoryId: string, updates: Partial<WellnessCategory>, originalCategory?: WellnessCategory): void => {
      optimistic.createOptimisticUpdate("wellness_categories", categoryId, updates, originalCategory)
    },
    [optimistic],
  )

  // Function to apply optimistic updates to categories
  const applyOptimisticCategories = useCallback(
    (categories: WellnessCategory[]): WellnessCategory[] => {
      return optimistic.applyUpdates<WellnessCategory>("wellness_categories", categories)
    },
    [optimistic],
  )

  // Function to update a goal optimistically
  const updateOptimisticGoal = useCallback(
    (goalData: Partial<CategoryGoal> & { category: string }, originalGoal?: CategoryGoal): CategoryGoal => {
      const tempId = originalGoal?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const timestamp = new Date().toISOString()

      const optimisticGoal: CategoryGoal = {
        id: tempId,
        category: goalData.category,
        goal_hours: goalData.goal_hours || 0,
        name: goalData.name || originalGoal?.name || "Unknown Category",
        color: goalData.color || originalGoal?.color || "#cccccc",
        notes: goalData.notes || originalGoal?.notes || null,
        __optimistic: true,
        created_at: originalGoal?.created_at || timestamp,
        updated_at: timestamp,
      } as CategoryGoal

      if (originalGoal) {
        // Update existing goal
        optimistic.createOptimisticUpdate("wellness_goals", tempId, optimisticGoal, originalGoal)
      } else {
        // Create new goal
        optimistic.createOptimisticInsert("wellness_goals", optimisticGoal)
      }

      return optimisticGoal
    },
    [optimistic],
  )

  // Function to apply optimistic updates to goals
  const applyOptimisticGoals = useCallback(
    (goals: CategoryGoal[]): CategoryGoal[] => {
      return optimistic.applyUpdates<CategoryGoal>("wellness_goals", goals)
    },
    [optimistic],
  )

  // Confirm/fail update helpers
  const confirmUpdate = useCallback(
    (tempId: string, realData?: any) => {
      optimistic.confirmUpdate(tempId, realData)
    },
    [optimistic],
  )

  const failUpdate = useCallback(
    (tempId: string, error: Error) => {
      optimistic.failUpdate(tempId, error)
    },
    [optimistic],
  )

  // For debugging and status display
  const getOptimisticStats = useCallback(() => {
    return optimistic.getStats()
  }, [optimistic])

  // Set up listeners for optimistic updates
  useEffect(() => {
    if (isListening) return

    const listener = () => {
      // This will be called whenever an optimistic update changes
      // We don't need to do anything here because the components will re-render
      // when they call the apply functions, but this is useful for debugging
    }

    optimistic.addListener(listener)
    setIsListening(true)

    return () => {
      optimistic.removeListener(listener)
      setIsListening(false)
    }
  }, [optimistic, isListening])

  return {
    // Entry operations
    addOptimisticEntry,
    deleteOptimisticEntry,
    applyOptimisticEntries,

    // Category operations
    addOptimisticCategory,
    updateOptimisticCategory,
    applyOptimisticCategories,

    // Goal operations
    updateOptimisticGoal,
    applyOptimisticGoals,

    // General operations
    confirmUpdate,
    failUpdate,
    getOptimisticStats,
  }
}

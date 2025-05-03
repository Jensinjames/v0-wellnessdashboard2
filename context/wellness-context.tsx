"use client"

import type React from "react"

import { createContext, useContext, useCallback, useRef, useEffect } from "react"
import {
  type WellnessCategory,
  type WellnessGoal,
  type WellnessEntryData,
  DEFAULT_CATEGORIES,
  type CategoryId,
} from "@/types/wellness"
import { usePersistentState, useStableCallback } from "@/lib/state-utils"
import { useDeepMemo } from "@/lib/memo-utils"

interface WellnessContextType {
  categories: WellnessCategory[]
  goals: WellnessGoal[]
  entries: WellnessEntryData[]
  isLoading: boolean
  addCategory: (category: WellnessCategory) => { success: boolean; message?: string }
  updateCategory: (categoryId: CategoryId, updates: Partial<WellnessCategory>) => { success: boolean; message?: string }
  removeCategory: (categoryId: CategoryId) => void
  setGoal: (goal: WellnessGoal) => void
  updateGoals: (goals: WellnessGoal[]) => void
  addEntry: (entry: WellnessEntryData) => void
  updateEntry: (entryId: string, updates: Partial<WellnessEntryData>) => void
  removeEntry: (entryId: string) => void
  getCategoryById: (categoryId: CategoryId) => WellnessCategory | undefined
  getGoalByCategoryAndMetric: (categoryId: CategoryId, metricId: string) => number
  reorderCategories: (startIndex: number, endIndex: number) => void
  categoryIdExists: (id: string) => boolean
  metricIdExistsInCategory: (categoryId: string, metricId: string) => boolean
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined)

// Sample entries for demonstration
const sampleEntries: WellnessEntryData[] = [
  {
    id: "1",
    date: new Date(2023, 3, 15),
    metrics: [
      { categoryId: "faith", metricId: "dailyPrayer", value: 15 },
      { categoryId: "faith", metricId: "meditation", value: 10 },
      { categoryId: "faith", metricId: "scriptureStudy", value: 20 },
      { categoryId: "life", metricId: "familyTime", value: 2 },
      { categoryId: "life", metricId: "socialActivities", value: 1 },
      { categoryId: "life", metricId: "hobbies", value: 1.5 },
      { categoryId: "work", metricId: "productivity", value: 75 },
      { categoryId: "work", metricId: "projectsCompleted", value: 1 },
      { categoryId: "work", metricId: "learningHours", value: 2 },
      { categoryId: "health", metricId: "exercise", value: 1 },
      { categoryId: "health", metricId: "sleep", value: 7 },
      { categoryId: "health", metricId: "stressLevel", value: 4 },
    ],
  },
  // Add more sample entries as needed
]

// Generate initial goals from default categories
const generateInitialGoals = (): WellnessGoal[] => {
  return DEFAULT_CATEGORIES.flatMap((category) =>
    category.metrics.map((metric) => ({
      categoryId: category.id,
      metricId: metric.id,
      value: metric.defaultGoal,
    })),
  )
}

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  // Use persistent state for categories, goals, and entries
  const [categories, setCategories, categoriesLoading] = usePersistentState<WellnessCategory[]>(
    "wellnessCategories",
    DEFAULT_CATEGORIES,
  )

  const [goals, setGoals, goalsLoading] = usePersistentState<WellnessGoal[]>("wellnessGoals", generateInitialGoals())

  const [entries, setEntries, entriesLoading] = usePersistentState<WellnessEntryData[]>(
    "wellnessEntries",
    sampleEntries,
  )

  // Track if data has been initialized
  const initialized = useRef(false)

  // Initialize data if needed
  useEffect(() => {
    if (!initialized.current && !categoriesLoading && !goalsLoading && !entriesLoading) {
      // If categories are empty, initialize with defaults
      if (categories.length === 0) {
        setCategories(DEFAULT_CATEGORIES)
      }

      // If goals are empty, initialize with defaults
      if (goals.length === 0) {
        setGoals(generateInitialGoals())
      }

      initialized.current = true
    }
  }, [categories, goals, categoriesLoading, goalsLoading, entriesLoading, setCategories, setGoals])

  // Category management functions
  const categoryIdExists = useCallback(
    (id: string): boolean => {
      return categories.some((cat) => cat.id === id)
    },
    [categories],
  )

  const metricIdExistsInCategory = useCallback(
    (categoryId: string, metricId: string): boolean => {
      const category = categories.find((cat) => cat.id === categoryId)
      return category ? category.metrics.some((metric) => metric.id === metricId) : false
    },
    [categories],
  )

  // Category management functions with stable callbacks
  const addCategory = useStableCallback(
    (category: WellnessCategory) => {
      // Check if category ID already exists
      if (categoryIdExists(category.id)) {
        return {
          success: false,
          message: `A category with ID "${category.id}" already exists.`,
        }
      }

      // Check for duplicate metric IDs within the category
      const metricIds = new Set<string>()
      for (const metric of category.metrics) {
        if (metricIds.has(metric.id)) {
          return {
            success: false,
            message: `Duplicate metric ID "${metric.id}" found in the category.`,
          }
        }
        metricIds.add(metric.id)
      }

      setCategories((prev) => [...prev, category])
      return { success: true }
    },
    [categoryIdExists, setCategories],
  )

  const updateCategory = useStableCallback(
    (categoryId: CategoryId, updates: Partial<WellnessCategory>) => {
      // If we're updating metrics, check for duplicates
      if (updates.metrics) {
        const metricIds = new Set<string>()
        for (const metric of updates.metrics) {
          if (metricIds.has(metric.id)) {
            return {
              success: false,
              message: `Duplicate metric ID "${metric.id}" found in the updated metrics.`,
            }
          }
          metricIds.add(metric.id)
        }
      }

      setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat)))
      return { success: true }
    },
    [setCategories],
  )

  const removeCategory = useCallback(
    (categoryId: CategoryId) => {
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
      // Also remove related goals
      setGoals((prev) => prev.filter((goal) => goal.categoryId !== categoryId))
    },
    [setCategories, setGoals],
  )

  // Goal management functions
  const setGoal = useCallback(
    (goal: WellnessGoal) => {
      setGoals((prev) => {
        const existingIndex = prev.findIndex((g) => g.categoryId === goal.categoryId && g.metricId === goal.metricId)

        if (existingIndex >= 0) {
          // Update existing goal
          const updated = [...prev]
          updated[existingIndex] = goal
          return updated
        } else {
          // Add new goal
          return [...prev, goal]
        }
      })
    },
    [setGoals],
  )

  const updateGoals = useCallback(
    (newGoals: WellnessGoal[]) => {
      setGoals((prev) => {
        const updated = [...prev]

        newGoals.forEach((newGoal) => {
          const existingIndex = updated.findIndex(
            (g) => g.categoryId === newGoal.categoryId && g.metricId === newGoal.metricId,
          )

          if (existingIndex >= 0) {
            // Update existing goal
            updated[existingIndex] = newGoal
          } else {
            // Add new goal
            updated.push(newGoal)
          }
        })

        return updated
      })
    },
    [setGoals],
  )

  // Entry management functions
  const addEntry = useCallback(
    (entry: WellnessEntryData) => {
      // Check if this is an update to an existing entry for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)

      const isSameDay = entryDate.getTime() === today.getTime()

      if (isSameDay) {
        // For entries from today, check if we already have entries for these metrics
        const existingTodayEntries = entries.filter((e) => {
          const eDate = new Date(e.date)
          eDate.setHours(0, 0, 0, 0)
          return eDate.getTime() === today.getTime()
        })

        if (existingTodayEntries.length > 0) {
          // Update existing entries for today with the new metrics
          setEntries((prevEntries) => {
            return prevEntries.map((e) => {
              const eDate = new Date(e.date)
              eDate.setHours(0, 0, 0, 0)

              if (eDate.getTime() === today.getTime()) {
                // This is an entry for today, update its metrics
                const updatedMetrics = [...e.metrics]

                // For each metric in the new entry
                entry.metrics.forEach((newMetric) => {
                  const existingMetricIndex = updatedMetrics.findIndex(
                    (m) => m.categoryId === newMetric.categoryId && m.metricId === newMetric.metricId,
                  )

                  if (existingMetricIndex >= 0) {
                    // Update existing metric value
                    updatedMetrics[existingMetricIndex] = {
                      ...updatedMetrics[existingMetricIndex],
                      value: updatedMetrics[existingMetricIndex].value + newMetric.value,
                    }
                  } else {
                    // Add new metric
                    updatedMetrics.push(newMetric)
                  }
                })

                return {
                  ...e,
                  metrics: updatedMetrics,
                }
              }

              return e
            })
          })
          return
        }
      }

      // If not updating an existing entry, add as new
      setEntries((prev) => [...prev, entry])
    },
    [entries, setEntries],
  )

  const updateEntry = useCallback(
    (entryId: string, updates: Partial<WellnessEntryData>) => {
      setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry)))
    },
    [setEntries],
  )

  const removeEntry = useCallback(
    (entryId: string) => {
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
    },
    [setEntries],
  )

  // Helper functions
  const getCategoryById = useCallback(
    (categoryId: CategoryId) => {
      return categories.find((cat) => cat.id === categoryId)
    },
    [categories],
  )

  const getGoalByCategoryAndMetric = useCallback(
    (categoryId: CategoryId, metricId: string) => {
      const goal = goals.find((g) => g.categoryId === categoryId && g.metricId === metricId)

      if (goal) {
        return goal.value
      }

      // If no goal is found, look for the default goal in the category definition
      const category = categories.find((cat) => cat.id === categoryId)
      const metric = category?.metrics.find((m) => m.id === metricId)

      return metric?.defaultGoal || 0
    },
    [categories, goals],
  )

  const reorderCategories = useCallback(
    (startIndex: number, endIndex: number) => {
      setCategories((prev) => {
        const result = Array.from(prev)
        const [removed] = result.splice(startIndex, 1)
        result.splice(endIndex, 0, removed)
        return result
      })
    },
    [setCategories],
  )

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useDeepMemo(
    {
      categories,
      goals,
      entries,
      isLoading: categoriesLoading || goalsLoading || entriesLoading,
      addCategory,
      updateCategory,
      removeCategory,
      setGoal,
      updateGoals,
      addEntry,
      updateEntry,
      removeEntry,
      getCategoryById,
      getGoalByCategoryAndMetric,
      reorderCategories,
      categoryIdExists,
      metricIdExistsInCategory,
    },
    [
      categories,
      goals,
      entries,
      categoriesLoading,
      goalsLoading,
      entriesLoading,
      addCategory,
      updateCategory,
      removeCategory,
      setGoal,
      updateGoals,
      addEntry,
      updateEntry,
      removeEntry,
      getCategoryById,
      getGoalByCategoryAndMetric,
      reorderCategories,
      categoryIdExists,
      metricIdExistsInCategory,
    ],
  )

  return <WellnessContext.Provider value={contextValue}>{children}</WellnessContext.Provider>
}

export function useWellness() {
  const context = useContext(WellnessContext)
  if (context === undefined) {
    throw new Error("useWellness must be used within a WellnessProvider")
  }
  return context
}

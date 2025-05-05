"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { fetchWellnessCategories, fetchWellnessGoals, fetchWellnessEntries } from "@/services/wellness-service"
import { subscribeToMultipleTables } from "@/lib/supabase-realtime"
import { DEFAULT_CATEGORIES } from "@/types/wellness"
import type { WellnessCategory, WellnessEntryData, WellnessGoal, WellnessEntryMetric } from "@/types/wellness"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

// Default user ID for demo purposes
const DEFAULT_USER_ID = "310bdb78-46ed-46bf-9d43-f8b719fa9d20"

interface RealtimeWellnessContextType {
  categories: WellnessCategory[]
  goals: WellnessGoal[]
  entries: WellnessEntryData[]
  todayEntries: WellnessEntryMetric[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const RealtimeWellnessContext = createContext<RealtimeWellnessContextType | undefined>(undefined)

export function RealtimeWellnessProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<WellnessCategory[]>([])
  const [goals, setGoals] = useState<WellnessGoal[]>([])
  const [entries, setEntries] = useState<WellnessEntryData[]>([])
  const [todayEntries, setTodayEntries] = useState<WellnessEntryMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to get today's entries from all entries
  const extractTodayEntries = useCallback((allEntries: WellnessEntryData[]): WellnessEntryMetric[] => {
    const today = new Date().toISOString().split("T")[0]
    const todayEntry = allEntries.find((entry) => new Date(entry.date).toISOString().split("T")[0] === today)
    return todayEntry?.metrics || []
  }, [])

  // Function to refresh all data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch data from Supabase
      const [categoriesData, goalsData, entriesData] = await Promise.all([
        fetchWellnessCategories(),
        fetchWellnessGoals(),
        fetchWellnessEntries(),
      ])

      // If we have categories from the database, use them
      if (categoriesData.length > 0) {
        // Merge with default metrics since we don't have metrics in the database yet
        const mergedCategories = categoriesData.map((dbCategory) => {
          const defaultCategory = DEFAULT_CATEGORIES.find((c) => c.name === dbCategory.name)
          return {
            ...dbCategory,
            metrics: defaultCategory?.metrics || [],
          }
        })

        setCategories(mergedCategories)
      } else {
        // Fallback to default categories
        setCategories(DEFAULT_CATEGORIES)
      }

      setGoals(goalsData)
      setEntries(entriesData)
      setTodayEntries(extractTodayEntries(entriesData))
    } catch (err) {
      console.error("Error loading wellness data:", err)
      setError("Failed to load wellness data. Please try again later.")

      // Fallback to default categories
      setCategories(DEFAULT_CATEGORIES)
    } finally {
      setLoading(false)
    }
  }, [extractTodayEntries])

  // Handle real-time updates for wellness entries
  const handleEntryChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<any>) => {
      console.log("Real-time entry update:", payload)

      // Refresh all entries data when a change occurs
      // This is a simple approach - for a more optimized approach, we could update only the affected entry
      await refreshData()
    },
    [refreshData],
  )

  // Handle real-time updates for wellness goals
  const handleGoalChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<any>) => {
      console.log("Real-time goal update:", payload)

      // Refresh goals data when a change occurs
      await refreshData()
    },
    [refreshData],
  )

  // Handle real-time updates for wellness categories
  const handleCategoryChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<any>) => {
      console.log("Real-time category update:", payload)

      // Refresh categories data when a change occurs
      await refreshData()
    },
    [refreshData],
  )

  // Initial data load and subscription setup
  useEffect(() => {
    // Load initial data
    refreshData()

    // Set up real-time subscriptions
    const cleanup = subscribeToMultipleTables([
      {
        table: "wellness_entries",
        event: "*",
        callback: handleEntryChange,
        filter: {
          column: "user_id",
          value: DEFAULT_USER_ID,
        },
      },
      {
        table: "wellness_goals",
        event: "*",
        callback: handleGoalChange,
        filter: {
          column: "user_id",
          value: DEFAULT_USER_ID,
        },
      },
      {
        table: "wellness_categories",
        event: "*",
        callback: handleCategoryChange,
        filter: {
          column: "user_id",
          value: DEFAULT_USER_ID,
        },
      },
    ])

    // Clean up subscriptions when component unmounts
    return cleanup
  }, [handleCategoryChange, handleEntryChange, handleGoalChange, refreshData])

  return (
    <RealtimeWellnessContext.Provider
      value={{
        categories,
        goals,
        entries,
        todayEntries,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </RealtimeWellnessContext.Provider>
  )
}

export function useRealtimeWellness() {
  const context = useContext(RealtimeWellnessContext)

  if (context === undefined) {
    throw new Error("useRealtimeWellness must be used within a RealtimeWellnessProvider")
  }

  return context
}

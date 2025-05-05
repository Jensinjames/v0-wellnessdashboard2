"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { fetchWellnessCategories, fetchWellnessGoals, fetchWellnessEntries } from "@/services/wellness-service"
import { DEFAULT_CATEGORIES } from "@/types/wellness"
import type { WellnessCategory, WellnessEntryData, WellnessGoal } from "@/types/wellness"

interface SupabaseWellnessContextType {
  categories: WellnessCategory[]
  goals: WellnessGoal[]
  entries: WellnessEntryData[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const SupabaseWellnessContext = createContext<SupabaseWellnessContextType | undefined>(undefined)

export function SupabaseWellnessProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<WellnessCategory[]>([])
  const [goals, setGoals] = useState<WellnessGoal[]>([])
  const [entries, setEntries] = useState<WellnessEntryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshData = async () => {
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
    } catch (err) {
      console.error("Error loading wellness data:", err)
      setError("Failed to load wellness data. Please try again later.")

      // Fallback to default categories
      setCategories(DEFAULT_CATEGORIES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return (
    <SupabaseWellnessContext.Provider
      value={{
        categories,
        goals,
        entries,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </SupabaseWellnessContext.Provider>
  )
}

export function useSupabaseWellness() {
  const context = useContext(SupabaseWellnessContext)

  if (context === undefined) {
    throw new Error("useSupabaseWellness must be used within a SupabaseWellnessProvider")
  }

  return context
}

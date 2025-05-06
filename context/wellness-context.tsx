"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import {
  type WellnessCategory,
  type WellnessGoal,
  type WellnessEntryData,
  DEFAULT_CATEGORIES,
  type CategoryId,
} from "@/types/wellness"
import { useSync } from "@/hooks/use-sync"

interface WellnessContextType {
  categories: WellnessCategory[]
  goals: WellnessGoal[]
  entries: WellnessEntryData[]
  isLoading: boolean
  error: string | null
  isOffline: boolean
  addCategory: (category: WellnessCategory) => any
  updateCategory: (categoryId: CategoryId, updates: Partial<WellnessCategory>) => any
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
  refreshData: () => Promise<void>
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined)

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { queueSync } = useSync()
  const [categories, setCategories] = useState<WellnessCategory[]>([])
  const [goals, setGoals] = useState<WellnessGoal[]>([])
  const [entries, setEntries] = useState<WellnessEntryData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  // Check network status
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored")
      setIsOffline(false)
      // Attempt to sync data when connection is restored
      refreshData().catch((err) => {
        console.error("Error refreshing data after coming online:", err)
      })
    }

    const handleOffline = () => {
      console.log("Network connection lost")
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Set initial state
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadLocalData = () => {
      try {
        // Load categories
        const savedCategories = localStorage.getItem("wellnessCategories")
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories))
        } else {
          setCategories(DEFAULT_CATEGORIES)
        }

        // Load goals
        const savedGoals = localStorage.getItem("wellnessGoals")
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals))
        }

        // Load entries
        const savedEntries = localStorage.getItem("wellnessEntries")
        if (savedEntries) {
          // Parse the JSON string and convert date strings back to Date objects
          const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          }))
          setEntries(parsedEntries)
        }
      } catch (error) {
        console.error("Error loading wellness data from localStorage:", error)
      }
    }

    // Load local data initially
    loadLocalData()
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wellnessCategories", JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem("wellnessGoals", JSON.stringify(goals))
  }, [goals])

  useEffect(() => {
    localStorage.setItem("wellnessEntries", JSON.stringify(entries))
  }, [entries])

  // Fetch data from Supabase when user changes
  useEffect(() => {
    if (user) {
      refreshData().catch((err) => {
        console.error("Error in initial data refresh:", err)
      })
    } else {
      // If no user, use default categories but empty goals and entries
      setCategories(DEFAULT_CATEGORIES)
      setGoals([])
      setEntries([])
      setIsLoading(false)
    }
  }, [user])

  // Helper function to fetch with timeout
  const fetchWithTimeout = async (promise: Promise<any>, timeoutMs = 8000) => {
    let timeoutId: NodeJS.Timeout

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Request timed out"))
      }, timeoutMs)
    })

    try {
      const result = await Promise.race([promise, timeoutPromise])
      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Function to refresh data from Supabase
  const refreshData = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Check if we're offline
      if (!navigator.onLine) {
        console.log("Operating in offline mode, using local data")
        setIsOffline(true)
        setIsLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      let userCategories: WellnessCategory[] = []

      // Fetch user categories with timeout
      try {
        console.log("Fetching categories...")
        const categoriesPromise = supabase.from("user_categories").select("*").eq("user_id", user.id)

        const { data: categoriesData, error: categoriesError } = await fetchWithTimeout(categoriesPromise)

        if (categoriesError) {
          throw new Error(`Error fetching categories: ${categoriesError.message}`)
        }

        // If no categories found, use default categories
        userCategories =
          categoriesData && categoriesData.length > 0
            ? categoriesData.map(mapDbCategoryToWellnessCategory)
            : DEFAULT_CATEGORIES

        console.log("Categories fetched successfully:", userCategories.length)
      } catch (categoryError) {
        console.error("Error in category fetching:", categoryError)

        // Check if it's a network error
        if (
          categoryError instanceof Error &&
          (categoryError.message.includes("Failed to fetch") ||
            categoryError.message.includes("Network Error") ||
            categoryError.message.includes("timeout"))
        ) {
          setIsOffline(true)
          console.log("Network error detected during category fetch, switching to offline mode")

          // Fall back to local categories if available, otherwise use defaults
          const savedCategories = localStorage.getItem("wellnessCategories")
          if (savedCategories) {
            userCategories = JSON.parse(savedCategories)
          } else {
            userCategories = DEFAULT_CATEGORIES
          }
        } else {
          // For other errors, also fall back to local data
          const savedCategories = localStorage.getItem("wellnessCategories")
          if (savedCategories) {
            userCategories = JSON.parse(savedCategories)
          } else {
            userCategories = DEFAULT_CATEGORIES
          }
        }
      }

      // Fetch user metrics for each category if we're still online
      if (navigator.onLine && !isOffline) {
        for (const category of userCategories) {
          try {
            console.log(`Fetching metrics for category ${category.id}...`)
            const metricsPromise = supabase.from("user_metrics").select("*").eq("category_id", category.id)

            const { data: metricsData, error: metricsError } = await fetchWithTimeout(metricsPromise, 5000)

            if (metricsError) {
              throw new Error(`Error fetching metrics: ${metricsError.message}`)
            }

            category.metrics =
              metricsData && metricsData.length > 0
                ? metricsData.map(mapDbMetricToWellnessMetric)
                : category.metrics || []

            console.log(`Metrics fetched successfully for category ${category.id}:`, category.metrics.length)
          } catch (metricError) {
            console.error("Error fetching metrics for category", category.id, ":", metricError)

            // If it's a network error, switch to offline mode
            if (
              metricError instanceof Error &&
              (metricError.message.includes("Failed to fetch") ||
                metricError.message.includes("Network Error") ||
                metricError.message.includes("timeout"))
            ) {
              setIsOffline(true)
              console.log("Network error detected during metrics fetch, switching to offline mode")
              break // Stop trying to fetch more metrics
            }

            // Continue with other categories, but keep existing metrics if available
          }
        }
      }

      // Set the categories regardless of how we got them
      setCategories(userCategories)

      // If we're offline now, don't try to fetch goals and entries
      if (isOffline || !navigator.onLine) {
        console.log("Skipping goals and entries fetch due to offline status")
        setIsLoading(false)
        return
      }

      // Fetch user goals
      try {
        console.log("Fetching goals...")
        const goalsPromise = supabase.from("user_goals").select("*").eq("user_id", user.id)

        const { data: goalsData, error: goalsError } = await fetchWithTimeout(goalsPromise)

        if (goalsError) {
          throw new Error(`Error fetching goals: ${goalsError.message}`)
        }

        const userGoals = goalsData && goalsData.length > 0 ? goalsData.map(mapDbGoalToWellnessGoal) : []

        setGoals(userGoals)
        console.log("Goals fetched successfully:", userGoals.length)
      } catch (goalError) {
        console.error("Error fetching goals:", goalError)

        // Check if it's a network error
        if (
          goalError instanceof Error &&
          (goalError.message.includes("Failed to fetch") ||
            goalError.message.includes("Network Error") ||
            goalError.message.includes("timeout"))
        ) {
          setIsOffline(true)
          console.log("Network error detected during goals fetch, switching to offline mode")
        }

        // Keep existing goals from localStorage
        const savedGoals = localStorage.getItem("wellnessGoals")
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals))
        }
      }

      // If we're offline now, don't try to fetch entries
      if (isOffline || !navigator.onLine) {
        console.log("Skipping entries fetch due to offline status")
        setIsLoading(false)
        return
      }

      // Fetch user entries
      try {
        console.log("Fetching entries...")
        const entriesPromise = supabase
          .from("user_entries")
          .select("*, entry_metrics(*)")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false })

        const { data: entriesData, error: entriesError } = await fetchWithTimeout(entriesPromise)

        if (entriesError) {
          throw new Error(`Error fetching entries: ${entriesError.message}`)
        }

        const userEntries =
          entriesData && entriesData.length > 0 ? entriesData.map((entry) => mapDbEntryToWellnessEntry(entry)) : []

        setEntries(userEntries)
        console.log("Entries fetched successfully:", userEntries.length)
      } catch (entryError) {
        console.error("Error fetching entries:", entryError)

        // Check if it's a network error
        if (
          entryError instanceof Error &&
          (entryError.message.includes("Failed to fetch") ||
            entryError.message.includes("Network Error") ||
            entryError.message.includes("timeout"))
        ) {
          setIsOffline(true)
          console.log("Network error detected during entries fetch, switching to offline mode")
        }

        // Keep existing entries from localStorage
        const savedEntries = localStorage.getItem("wellnessEntries")
        if (savedEntries) {
          const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          }))
          setEntries(parsedEntries)
        }
      }

      // If we got here without setting offline mode, we're online
      if (!isOffline) {
        setIsOffline(false)
      }
    } catch (err) {
      console.error("Error fetching wellness data:", err)
      setError(err instanceof Error ? err.message : "Unknown error fetching wellness data")

      // If we have an error, check if it's a network error
      if (
        err instanceof Error &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("Network Error") ||
          err.message.includes("network") ||
          err.message.includes("timeout"))
      ) {
        setIsOffline(true)
        console.log("Network error detected, switching to offline mode")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Helper functions to map database objects to wellness types
  const mapDbCategoryToWellnessCategory = (dbCategory: any): WellnessCategory => ({
    id: dbCategory.id,
    name: dbCategory.name,
    description: dbCategory.description || "",
    icon: dbCategory.icon || "Activity",
    color: dbCategory.color || "gray",
    enabled: dbCategory.enabled,
    metrics: [],
  })

  const mapDbMetricToWellnessMetric = (dbMetric: any) => ({
    id: dbMetric.id,
    name: dbMetric.name,
    description: dbMetric.description || "",
    unit: dbMetric.unit,
    min: dbMetric.min_value,
    max: dbMetric.max_value,
    step: dbMetric.step_value,
    defaultValue: dbMetric.default_value,
    defaultGoal: dbMetric.default_goal,
  })

  const mapDbGoalToWellnessGoal = (dbGoal: any): WellnessGoal => ({
    categoryId: dbGoal.metric_id?.split(":")[0] || "",
    metricId: dbGoal.metric_id?.split(":")[1] || "",
    value: dbGoal.target_value,
  })

  const mapDbEntryToWellnessEntry = (dbEntry: any): WellnessEntryData => ({
    id: dbEntry.id,
    date: new Date(dbEntry.entry_date),
    metrics: Array.isArray(dbEntry.entry_metrics)
      ? dbEntry.entry_metrics.map((metric: any) => ({
          categoryId: metric.metric_id?.split(":")[0] || "",
          metricId: metric.metric_id?.split(":")[1] || "",
          value: metric.value,
        }))
      : [],
  })

  // Category management functions
  const categoryIdExists = (id: string): boolean => {
    return categories.some((cat) => cat.id === id)
  }

  const metricIdExistsInCategory = (categoryId: string, metricId: string): boolean => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.metrics.some((metric) => metric.id === metricId) : false
  }

  // Category management functions
  const addCategory = async (category: WellnessCategory) => {
    if (!user) return { success: false, message: "User not authenticated" }

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

    // Update local state first for immediate feedback
    setCategories((prev) => [...prev, category])

    // Queue the operation for sync
    queueSync({ type: "ADD_CATEGORY", payload: category })

    // If offline, just return success
    if (isOffline) {
      return { success: true }
    }

    try {
      const supabase = getSupabaseClient()

      // Add category to database
      const { data, error } = await supabase
        .from("user_categories")
        .insert({
          id: category.id,
          user_id: user.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          enabled: category.enabled,
        })
        .select()

      if (error) throw error

      // Add metrics to database
      for (const metric of category.metrics) {
        const { error: metricError } = await supabase.from("user_metrics").insert({
          id: metric.id,
          category_id: category.id,
          name: metric.name,
          description: metric.description,
          unit: metric.unit,
          min_value: metric.min,
          max_value: metric.max,
          step_value: metric.step,
          default_value: metric.defaultValue,
          default_goal: metric.defaultGoal,
        })

        if (metricError) throw metricError
      }

      return { success: true }
    } catch (err) {
      console.error("Error adding category:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
        return { success: true, message: "Added locally, will sync when online" }
      }

      return {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error adding category",
      }
    }
  }

  const updateCategory = async (categoryId: CategoryId, updates: Partial<WellnessCategory>) => {
    if (!user) return { success: false, message: "User not authenticated" }

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

    // Update local state first for immediate feedback
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat)))

    // Queue the operation for sync
    queueSync({ type: "UPDATE_CATEGORY", payload: { id: categoryId, updates } })

    // If offline, just return success
    if (isOffline) {
      return { success: true }
    }

    try {
      const supabase = getSupabaseClient()

      // Update category in database
      const { error } = await supabase
        .from("user_categories")
        .update({
          name: updates.name,
          description: updates.description,
          icon: updates.icon,
          color: updates.color,
          enabled: updates.enabled,
        })
        .eq("id", categoryId)
        .eq("user_id", user.id)

      if (error) throw error

      // If metrics are updated, handle them
      if (updates.metrics) {
        // Get current metrics
        const { data: currentMetrics, error: fetchError } = await supabase
          .from("user_metrics")
          .select("id")
          .eq("category_id", categoryId)

        if (fetchError) throw fetchError

        const currentMetricIds = new Set(currentMetrics.map((m) => m.id))
        const updatedMetricIds = new Set(updates.metrics.map((m) => m.id))

        // Delete metrics that are no longer in the updated list
        for (const metricId of currentMetricIds) {
          if (!updatedMetricIds.has(metricId)) {
            const { error: deleteError } = await supabase
              .from("user_metrics")
              .delete()
              .eq("id", metricId)
              .eq("category_id", categoryId)

            if (deleteError) throw deleteError
          }
        }

        // Update or insert metrics
        for (const metric of updates.metrics) {
          if (currentMetricIds.has(metric.id)) {
            // Update existing metric
            const { error: updateError } = await supabase
              .from("user_metrics")
              .update({
                name: metric.name,
                description: metric.description,
                unit: metric.unit,
                min_value: metric.min,
                max_value: metric.max,
                step_value: metric.step,
                default_value: metric.defaultValue,
                default_goal: metric.defaultGoal,
              })
              .eq("id", metric.id)
              .eq("category_id", categoryId)

            if (updateError) throw updateError
          } else {
            // Insert new metric
            const { error: insertError } = await supabase.from("user_metrics").insert({
              id: metric.id,
              category_id: categoryId,
              name: metric.name,
              description: metric.description,
              unit: metric.unit,
              min_value: metric.min,
              max_value: metric.max,
              step_value: metric.step,
              default_value: metric.defaultValue,
              default_goal: metric.defaultGoal,
            })

            if (insertError) throw insertError
          }
        }
      }

      return { success: true }
    } catch (err) {
      console.error("Error updating category:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
        return { success: true, message: "Updated locally, will sync when online" }
      }

      return {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error updating category",
      }
    }
  }

  const removeCategory = async (categoryId: CategoryId) => {
    if (!user) return

    // Update local state first for immediate feedback
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    setGoals((prev) => prev.filter((goal) => goal.categoryId !== categoryId))

    // Queue the operation for sync
    queueSync({ type: "REMOVE_CATEGORY", payload: categoryId })

    // If offline, just return
    if (isOffline) return

    try {
      const supabase = getSupabaseClient()

      // Delete category from database (cascade will handle metrics)
      const { error } = await supabase.from("user_categories").delete().eq("id", categoryId).eq("user_id", user.id)

      if (error) throw error
    } catch (err) {
      console.error("Error removing category:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error removing category")
      }
    }
  }

  // Goal management functions
  const setGoal = async (goal: WellnessGoal) => {
    if (!user) return

    // Update local state first for immediate feedback
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

    // Queue the operation for sync
    queueSync({ type: "SET_GOAL", payload: goal })

    // If offline, just return
    if (isOffline) return

    try {
      const supabase = getSupabaseClient()
      const metricKey = `${goal.categoryId}:${goal.metricId}`

      // Check if goal exists
      const { data: existingGoal, error: checkError } = await supabase
        .from("user_goals")
        .select("id")
        .eq("user_id", user.id)
        .eq("metric_id", metricKey)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingGoal) {
        // Update existing goal
        const { error: updateError } = await supabase
          .from("user_goals")
          .update({ target_value: goal.value })
          .eq("id", existingGoal.id)

        if (updateError) throw updateError
      } else {
        // Insert new goal
        const { error: insertError } = await supabase.from("user_goals").insert({
          user_id: user.id,
          metric_id: metricKey,
          target_value: goal.value,
          start_date: new Date().toISOString().split("T")[0],
        })

        if (insertError) throw insertError
      }
    } catch (err) {
      console.error("Error setting goal:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error setting goal")
      }
    }
  }

  const updateGoals = async (newGoals: WellnessGoal[]) => {
    if (!user) return

    // Update local state first
    for (const goal of newGoals) {
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

      // Queue each goal for sync
      queueSync({ type: "SET_GOAL", payload: goal })
    }

    // If offline, just return
    if (isOffline) return

    try {
      for (const goal of newGoals) {
        await setGoal(goal)
      }
    } catch (err) {
      console.error("Error updating goals:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error updating goals")
      }
    }
  }

  // Entry management functions
  const addEntry = async (entry: WellnessEntryData) => {
    if (!user) return

    // Generate a unique ID if not provided
    const entryWithId = {
      ...entry,
      id: entry.id || crypto.randomUUID(),
    }

    // Update local state first for immediate feedback
    setEntries((prev) => [entryWithId, ...prev])

    // Queue the operation for sync
    queueSync({ type: "ADD_ENTRY", payload: entryWithId })

    // If offline, just return
    if (isOffline) return

    try {
      const supabase = getSupabaseClient()

      // Format entry date
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)
      const formattedDate = entryDate.toISOString().split("T")[0]

      // Check if entry exists for this date
      const { data: existingEntry, error: checkError } = await supabase
        .from("user_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("entry_date", formattedDate)
        .maybeSingle()

      if (checkError) throw checkError

      let entryId: string

      if (existingEntry) {
        // Use existing entry
        entryId = existingEntry.id
      } else {
        // Create new entry
        const { data: newEntry, error: insertError } = await supabase
          .from("user_entries")
          .insert({
            user_id: user.id,
            entry_date: formattedDate,
          })
          .select()

        if (insertError) throw insertError
        if (!newEntry || newEntry.length === 0) throw new Error("Failed to create entry")

        entryId = newEntry[0].id
      }

      // Add metrics for the entry
      for (const metric of entry.metrics) {
        const metricKey = `${metric.categoryId}:${metric.metricId}`

        // Check if metric exists for this entry
        const { data: existingMetric, error: metricCheckError } = await supabase
          .from("entry_metrics")
          .select("id")
          .eq("entry_id", entryId)
          .eq("metric_id", metricKey)
          .maybeSingle()

        if (metricCheckError) throw metricCheckError

        if (existingMetric) {
          // Update existing metric
          const { error: updateError } = await supabase
            .from("entry_metrics")
            .update({ value: metric.value })
            .eq("id", existingMetric.id)

          if (updateError) throw updateError
        } else {
          // Insert new metric
          const { error: insertError } = await supabase.from("entry_metrics").insert({
            entry_id: entryId,
            metric_id: metricKey,
            value: metric.value,
          })

          if (insertError) throw insertError
        }
      }

      // Refresh entries to get the updated data
      await refreshData()
    } catch (err) {
      console.error("Error adding entry:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error adding entry")
      }
    }
  }

  const updateEntry = async (entryId: string, updates: Partial<WellnessEntryData>) => {
    if (!user) return

    // Update local state first for immediate feedback
    setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry)))

    // Queue the operation for sync
    queueSync({ type: "UPDATE_ENTRY", payload: { id: entryId, updates } })

    // If offline, just return
    if (isOffline) return

    try {
      const supabase = getSupabaseClient()

      // If date is updated
      if (updates.date) {
        const formattedDate = new Date(updates.date).toISOString().split("T")[0]

        const { error: updateError } = await supabase
          .from("user_entries")
          .update({ entry_date: formattedDate })
          .eq("id", entryId)
          .eq("user_id", user.id)

        if (updateError) throw updateError
      }

      // If metrics are updated
      if (updates.metrics) {
        // Get current metrics
        const { data: currentMetrics, error: fetchError } = await supabase
          .from("entry_metrics")
          .select("id, metric_id")
          .eq("entry_id", entryId)

        if (fetchError) throw fetchError

        // Create a map of current metrics
        const currentMetricMap = new Map(currentMetrics.map((m) => [m.metric_id, m.id]))

        // Process each updated metric
        for (const metric of updates.metrics) {
          const metricKey = `${metric.categoryId}:${metric.metricId}`

          if (currentMetricMap.has(metricKey)) {
            // Update existing metric
            const { error: updateError } = await supabase
              .from("entry_metrics")
              .update({ value: metric.value })
              .eq("id", currentMetricMap.get(metricKey))

            if (updateError) throw updateError
          } else {
            // Insert new metric
            const { error: insertError } = await supabase.from("entry_metrics").insert({
              entry_id: entryId,
              metric_id: metricKey,
              value: metric.value,
            })

            if (insertError) throw insertError
          }
        }
      }

      // Refresh entries to get the updated data
      await refreshData()
    } catch (err) {
      console.error("Error updating entry:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error updating entry")
      }
    }
  }

  const removeEntry = async (entryId: string) => {
    if (!user) return

    // Update local state first for immediate feedback
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId))

    // Queue the operation for sync
    queueSync({ type: "REMOVE_ENTRY", payload: entryId })

    // If offline, just return
    if (isOffline) return

    try {
      const supabase = getSupabaseClient()

      // Delete entry from database (cascade will handle metrics)
      const { error } = await supabase.from("user_entries").delete().eq("id", entryId).eq("user_id", user.id)

      if (error) throw error
    } catch (err) {
      console.error("Error removing entry:", err)

      // Check if it's a network error and set offline mode
      if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("Network Error"))) {
        setIsOffline(true)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error removing entry")
      }
    }
  }

  // Helper functions
  const getCategoryById = (categoryId: CategoryId) => {
    return categories.find((cat) => cat.id === categoryId)
  }

  const getGoalByCategoryAndMetric = (categoryId: CategoryId, metricId: string) => {
    const goal = goals.find((g) => g.categoryId === categoryId && g.metricId === metricId)

    if (goal) {
      return goal.value
    }

    // If no goal is found, look for the default goal in the category definition
    const category = categories.find((cat) => cat.id === categoryId)
    const metric = category?.metrics.find((m) => m.id === metricId)

    return metric?.defaultGoal || 0
  }

  const reorderCategories = async (startIndex: number, endIndex: number) => {
    if (!user) return

    setCategories((prev) => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })

    // In a real implementation, you would update the order in the database
    // This is a placeholder for that functionality
  }

  const value = {
    categories,
    goals,
    entries,
    isLoading,
    error,
    isOffline,
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
    refreshData,
  }

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>
}

export function useWellness() {
  const context = useContext(WellnessContext)
  if (context === undefined) {
    throw new Error("useWellness must be used within a WellnessProvider")
  }
  return context
}

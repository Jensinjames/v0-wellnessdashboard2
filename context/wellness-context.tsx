"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  type WellnessCategory,
  type WellnessGoal,
  type WellnessEntryData,
  DEFAULT_CATEGORIES,
  type CategoryId,
} from "@/types/wellness"

interface WellnessContextType {
  categories: WellnessCategory[]
  goals: WellnessGoal[]
  entries: WellnessEntryData[]
  addCategory: (category: WellnessCategory) => void
  updateCategory: (categoryId: CategoryId, updates: Partial<WellnessCategory>) => void
  removeCategory: (categoryId: CategoryId) => void
  setGoal: (goal: WellnessGoal) => void
  updateGoals: (goals: WellnessGoal[]) => void
  addEntry: (entry: WellnessEntryData) => void
  updateEntry: (entryId: string, updates: Partial<WellnessEntryData>) => void
  removeEntry: (entryId: string) => void
  getCategoryById: (categoryId: CategoryId) => WellnessCategory | undefined
  getGoalByCategoryAndMetric: (categoryId: CategoryId, metricId: string) => number
  reorderCategories: (startIndex: number, endIndex: number) => void
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
  const [categories, setCategories] = useState<WellnessCategory[]>(DEFAULT_CATEGORIES)
  const [goals, setGoals] = useState<WellnessGoal[]>(generateInitialGoals())
  const [entries, setEntries] = useState<WellnessEntryData[]>(sampleEntries)

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Load categories
        const savedCategories = localStorage.getItem("wellnessCategories")
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories))
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
        console.error("Error loading wellness data:", error)
      }
    }

    loadData()
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

  // Category management functions
  const addCategory = (category: WellnessCategory) => {
    setCategories((prev) => [...prev, category])
  }

  const updateCategory = (categoryId: CategoryId, updates: Partial<WellnessCategory>) => {
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat)))
  }

  const removeCategory = (categoryId: CategoryId) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    // Also remove related goals
    setGoals((prev) => prev.filter((goal) => goal.categoryId !== categoryId))
  }

  // Goal management functions
  const setGoal = (goal: WellnessGoal) => {
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
  }

  const updateGoals = (newGoals: WellnessGoal[]) => {
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
  }

  // Entry management functions
  const addEntry = (entry: WellnessEntryData) => {
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
        const updatedEntries = entries.map((e) => {
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

        setEntries(updatedEntries)
        return
      }
    }

    // If not updating an existing entry, add as new
    setEntries((prev) => [...prev, entry])
  }

  const updateEntry = (entryId: string, updates: Partial<WellnessEntryData>) => {
    setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry)))
  }

  const removeEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
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

  const reorderCategories = (startIndex: number, endIndex: number) => {
    setCategories((prev) => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }

  const value = {
    categories,
    goals,
    entries,
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

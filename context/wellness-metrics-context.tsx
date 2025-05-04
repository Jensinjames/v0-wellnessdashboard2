"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import * as wellnessService from "@/services/wellness-service"
import type { Database } from "@/types/database"

type WellnessEntriesRow = Database["public"]["Tables"]["wellness_entries"]["Row"]
type WellnessGoalsRow = Database["public"]["Tables"]["wellness_goals"]["Row"]

export type WellnessCategory = "faith" | "life" | "work" | "health"

export type WellnessMetrics = {
  entries: WellnessEntriesRow[]
  goals: WellnessGoalsRow[]
  totalHours: Record<WellnessCategory, number>
  goalHours: Record<WellnessCategory, number>
  percentages: Record<WellnessCategory, number>
  overallCompletion: number
}

type WellnessMetricsContextType = {
  metrics: WellnessMetrics
  isLoading: boolean
  error: string | null
  addEntry: (entry: Omit<WellnessEntriesRow, "id" | "created_at" | "user_id">) => Promise<void>
  updateEntry: (
    id: string,
    updates: Partial<Omit<WellnessEntriesRow, "id" | "created_at" | "user_id">>,
  ) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  setGoal: (category: WellnessCategory, goalHours: number) => Promise<void>
  refreshMetrics: () => Promise<void>
}

const WellnessMetricsContext = createContext<WellnessMetricsContextType | undefined>(undefined)

const defaultMetrics: WellnessMetrics = {
  entries: [],
  goals: [],
  totalHours: { faith: 0, life: 0, work: 0, health: 0 },
  goalHours: { faith: 0, life: 0, work: 0, health: 0 },
  percentages: { faith: 0, life: 0, work: 0, health: 0 },
  overallCompletion: 0,
}

export function WellnessMetricsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<WellnessMetrics>(defaultMetrics)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateMetrics = useCallback((entries: WellnessEntriesRow[], goals: WellnessGoalsRow[]): WellnessMetrics => {
    // Initialize totals
    const totalHours: Record<WellnessCategory, number> = { faith: 0, life: 0, work: 0, health: 0 }
    const goalHours: Record<WellnessCategory, number> = { faith: 0, life: 0, work: 0, health: 0 }

    // Set default goals if none exist
    if (goals.length === 0) {
      goalHours.faith = 10
      goalHours.life = 20
      goalHours.work = 40
      goalHours.health = 14
    } else {
      // Sum up goal hours by category
      goals.forEach((goal) => {
        if (goal.category in goalHours) {
          goalHours[goal.category as WellnessCategory] = goal.goal_hours
        }
      })
    }

    // Calculate total hours by category
    entries.forEach((entry) => {
      if (entry.category in totalHours) {
        totalHours[entry.category as WellnessCategory] += entry.duration / 60 // Convert minutes to hours
      }
    })

    // Calculate percentages
    const percentages: Record<WellnessCategory, number> = {
      faith: goalHours.faith > 0 ? Math.min(100, (totalHours.faith / goalHours.faith) * 100) : 0,
      life: goalHours.life > 0 ? Math.min(100, (totalHours.life / goalHours.life) * 100) : 0,
      work: goalHours.work > 0 ? Math.min(100, (totalHours.work / goalHours.work) * 100) : 0,
      health: goalHours.health > 0 ? Math.min(100, (totalHours.health / goalHours.health) * 100) : 0,
    }

    // Calculate overall completion
    const totalGoalHours = Object.values(goalHours).reduce((sum, hours) => sum + hours, 0)
    const totalCompletedHours = Object.values(totalHours).reduce((sum, hours) => sum + hours, 0)
    const overallCompletion = totalGoalHours > 0 ? Math.min(100, (totalCompletedHours / totalGoalHours) * 100) : 0

    return {
      entries,
      goals,
      totalHours,
      goalHours,
      percentages,
      overallCompletion,
    }
  }, [])

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(defaultMetrics)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const [entries, goals] = await Promise.all([
        wellnessService.getUserEntries(user.id),
        wellnessService.getUserGoals(user.id),
      ])

      const calculatedMetrics = calculateMetrics(entries, goals)
      setMetrics(calculatedMetrics)
    } catch (err) {
      console.error("Error fetching wellness metrics:", err)
      setError(err instanceof Error ? err.message : "Failed to load wellness metrics")
    } finally {
      setIsLoading(false)
    }
  }, [user, calculateMetrics])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const addEntry = async (entry: Omit<WellnessEntriesRow, "id" | "created_at" | "user_id">) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const newEntry = await wellnessService.addWellnessEntry({
        ...entry,
        user_id: user.id,
      })

      setMetrics((prev) => {
        const updatedEntries = [newEntry, ...prev.entries]
        return calculateMetrics(updatedEntries, prev.goals)
      })
    } catch (err) {
      console.error("Error adding wellness entry:", err)
      throw err
    }
  }

  const updateEntry = async (
    id: string,
    updates: Partial<Omit<WellnessEntriesRow, "id" | "created_at" | "user_id">>,
  ) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const updatedEntry = await wellnessService.updateWellnessEntry(id, updates)

      setMetrics((prev) => {
        const updatedEntries = prev.entries.map((entry) => (entry.id === id ? updatedEntry : entry))
        return calculateMetrics(updatedEntries, prev.goals)
      })
    } catch (err) {
      console.error("Error updating wellness entry:", err)
      throw err
    }
  }

  const deleteEntry = async (id: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      await wellnessService.deleteWellnessEntry(id)

      setMetrics((prev) => {
        const updatedEntries = prev.entries.filter((entry) => entry.id !== id)
        return calculateMetrics(updatedEntries, prev.goals)
      })
    } catch (err) {
      console.error("Error deleting wellness entry:", err)
      throw err
    }
  }

  const setGoal = async (category: WellnessCategory, goalHours: number) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const updatedGoal = await wellnessService.setWellnessGoal({
        user_id: user.id,
        category,
        goal_hours: goalHours,
      })

      setMetrics((prev) => {
        // Replace or add the goal
        const existingGoalIndex = prev.goals.findIndex((g) => g.user_id === user.id && g.category === category)

        const updatedGoals = [...prev.goals]
        if (existingGoalIndex >= 0) {
          updatedGoals[existingGoalIndex] = updatedGoal
        } else {
          updatedGoals.push(updatedGoal)
        }

        return calculateMetrics(prev.entries, updatedGoals)
      })
    } catch (err) {
      console.error("Error setting wellness goal:", err)
      throw err
    }
  }

  const value = {
    metrics,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    setGoal,
    refreshMetrics: fetchMetrics,
  }

  return <WellnessMetricsContext.Provider value={value}>{children}</WellnessMetricsContext.Provider>
}

export function useWellnessMetrics() {
  const context = useContext(WellnessMetricsContext)
  if (context === undefined) {
    throw new Error("useWellnessMetrics must be used within a WellnessMetricsProvider")
  }
  return context
}

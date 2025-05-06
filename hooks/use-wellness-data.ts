"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import { useAuth } from "@/context/auth-context"

export interface WellnessEntry {
  id: string
  category: string
  activity: string
  duration: number
  notes?: string
  timestamp: string
  created_at: string
  metadata?: Record<string, any>
}

export interface WellnessGoal {
  id: string
  category: string
  goal_hours: number
  created_at: string
  updated_at: string
}

export interface WellnessCategory {
  id: string
  name: string
  color: string
  icon?: string | null
  user_id?: string | null
  created_at?: string
  updated_at?: string
}

export function useWellnessData() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<WellnessEntry[]>([])
  const [goals, setGoals] = useState<WellnessGoal[]>([])
  const [categories, setCategories] = useState<WellnessCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Fetch data in parallel
        const [entriesResponse, goalsResponse, categoriesResponse] = await Promise.all([
          // RLS will automatically filter to only show the user's entries
          supabase
            .from("wellness_entries")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(50),

          // RLS will automatically filter to only show the user's goals
          supabase
            .from("wellness_goals")
            .select("*"),

          // RLS will show both user's categories and system categories (null user_id)
          supabase
            .from("wellness_categories")
            .select("*")
            .order("name"),
        ])

        // Handle any errors
        if (entriesResponse.error) throw new Error(entriesResponse.error.message)
        if (goalsResponse.error) throw new Error(goalsResponse.error.message)
        if (categoriesResponse.error) throw new Error(categoriesResponse.error.message)

        // Update state with fetched data
        setEntries(entriesResponse.data || [])
        setGoals(goalsResponse.data || [])
        setCategories(categoriesResponse.data || [])
      } catch (err: any) {
        console.error("Error fetching wellness data:", err)
        setError(err.message || "Failed to fetch wellness data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Function to add a new entry (respects RLS)
  const addEntry = async (entry: Omit<WellnessEntry, "id" | "created_at">) => {
    if (!user) return { error: "User not authenticated" }

    try {
      const supabase = getSupabaseClient()

      // RLS will ensure user can only insert their own entries
      const { data, error } = await supabase
        .from("wellness_entries")
        .insert({
          ...entry,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Update local state
      setEntries((prev) => [data, ...prev])

      return { data, error: null }
    } catch (error: any) {
      console.error("Error adding entry:", error)
      return { error: error.message }
    }
  }

  return {
    entries,
    goals,
    categories,
    loading,
    error,
    addEntry,
  }
}

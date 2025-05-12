"use client"

import { useState, useEffect, useCallback } from "react"
import { useRealtimeUserData } from "@/lib/realtime/subscription-service"
import { createBrowserClient } from "@/lib/supabase"
import { handleRealtimePayload } from "@/lib/realtime/handle-deletions"
import type { Database } from "@/types/database"

type Goal = Database["public"]["Tables"]["goals"]["Row"]

/**
 * Hook to get and subscribe to real-time goal updates
 * @param userId The user ID
 * @param categoryId Optional category ID to filter by
 * @returns [goals, isLoading, error]
 */
export function useRealtimeGoals(userId: string, categoryId?: string): [Goal[], boolean, Error | null] {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch initial goals
  useEffect(() => {
    let mounted = true

    async function fetchGoals() {
      if (!userId) return

      try {
        setIsLoading(true)
        const supabase = createBrowserClient()
        let query = supabase.from("goals").select("*").eq("user_id", userId)

        // Filter by category if provided
        if (categoryId) {
          query = query.eq("category_id", categoryId)
        }

        // Order by end date (closest first)
        query = query.order("end_date", { ascending: true })

        const { data, error } = await query

        if (error) throw error

        if (mounted) {
          setGoals(data || [])
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching goals:", err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch goals"))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchGoals()

    return () => {
      mounted = false
    }
  }, [userId, categoryId])

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback(
    (payload: Goal) => {
      // Check if the goal matches our category filter
      if (categoryId && payload.category_id !== categoryId) {
        return
      }

      setGoals((currentGoals) => {
        // Check if this is an update to an existing goal
        const index = currentGoals.findIndex((g) => g.id === payload.id)

        if (index >= 0) {
          // Update existing goal
          const updatedGoals = [...currentGoals]
          updatedGoals[index] = payload
          return updatedGoals.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
        } else {
          // Add new goal
          return [...currentGoals, payload].sort(
            (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
          )
        }
      })
    },
    [categoryId],
  )

  // Handle real-time deletions
  const handleRealtimeDelete = useCallback((id: string) => {
    setGoals((currentGoals) => currentGoals.filter((g) => g.id !== id))
  }, [])

  // Subscribe to real-time updates
  const [isConnected, subscriptionError] = useRealtimeUserData<any>("goals", userId, (payload) => {
    if (payload) {
      handleRealtimePayload<Goal>(payload, handleRealtimeUpdate, handleRealtimeDelete)
    }
  })

  // Update error state if subscription fails
  useEffect(() => {
    if (subscriptionError) {
      setError(subscriptionError)
    }
  }, [subscriptionError])

  return [goals, isLoading, error]
}

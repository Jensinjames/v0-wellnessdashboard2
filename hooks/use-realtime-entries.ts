"use client"

import { useState, useEffect, useCallback } from "react"
import { useRealtimeUserData } from "@/lib/realtime/subscription-service"
import { createBrowserClient } from "@/lib/supabase"
import { handleRealtimePayload } from "@/lib/realtime/handle-deletions"
import type { Database } from "@/types/database"

type Entry = Database["public"]["Tables"]["entries"]["Row"]

export type EntryFilter = {
  startDate?: string
  endDate?: string
  categoryId?: string
}

/**
 * Hook to get and subscribe to real-time entry updates
 * @param userId The user ID
 * @param filter Optional filter criteria
 * @returns [entries, isLoading, error]
 */
export function useRealtimeEntries(userId: string, filter?: EntryFilter): [Entry[], boolean, Error | null] {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const filterKey = JSON.stringify(filter || {})

  // Fetch initial entries
  useEffect(() => {
    let mounted = true

    async function fetchEntries() {
      if (!userId) return

      try {
        setIsLoading(true)
        const supabase = createBrowserClient()
        let query = supabase.from("entries").select("*").eq("user_id", userId)

        // Apply filters if provided
        if (filter) {
          if (filter.startDate) {
            query = query.gte("date", filter.startDate)
          }
          if (filter.endDate) {
            query = query.lte("date", filter.endDate)
          }
          if (filter.categoryId) {
            query = query.eq("category_id", filter.categoryId)
          }
        }

        // Order by date (most recent first)
        query = query.order("date", { ascending: false })

        const { data, error } = await query

        if (error) throw error

        if (mounted) {
          setEntries(data || [])
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching entries:", err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch entries"))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchEntries()

    return () => {
      mounted = false
    }
  }, [userId, filterKey])

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback(
    (payload: Entry) => {
      // Check if the entry matches our filter criteria
      let matchesFilter = true
      if (filter) {
        if (filter.startDate && payload.date < filter.startDate) {
          matchesFilter = false
        }
        if (filter.endDate && payload.date > filter.endDate) {
          matchesFilter = false
        }
        if (filter.categoryId && payload.category_id !== filter.categoryId) {
          matchesFilter = false
        }
      }

      if (matchesFilter) {
        setEntries((currentEntries) => {
          // Check if this is an update to an existing entry
          const index = currentEntries.findIndex((e) => e.id === payload.id)

          if (index >= 0) {
            // Update existing entry
            const updatedEntries = [...currentEntries]
            updatedEntries[index] = payload
            return updatedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          } else {
            // Add new entry
            return [...currentEntries, payload].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          }
        })
      }
    },
    [filter],
  )

  // Handle real-time deletions
  const handleRealtimeDelete = useCallback((id: string) => {
    setEntries((currentEntries) => currentEntries.filter((e) => e.id !== id))
  }, [])

  // Subscribe to real-time updates
  const [isConnected, subscriptionError] = useRealtimeUserData<any>("entries", userId, (payload) => {
    if (payload) {
      handleRealtimePayload<Entry>(payload, handleRealtimeUpdate, handleRealtimeDelete)
    }
  })

  // Update error state if subscription fails
  useEffect(() => {
    if (subscriptionError) {
      setError(subscriptionError)
    }
  }, [subscriptionError])

  return [entries, isLoading, error]
}

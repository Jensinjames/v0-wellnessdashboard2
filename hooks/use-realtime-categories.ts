"use client"

import { useState, useEffect, useCallback } from "react"
import { useRealtimeUserData } from "@/lib/realtime/subscription-service"
import { createBrowserClient } from "@/lib/supabase"
import { handleRealtimePayload } from "@/lib/realtime/handle-deletions"
import type { Database } from "@/types/database"

type Category = Database["public"]["Tables"]["categories"]["Row"]

/**
 * Hook to get and subscribe to real-time category updates
 * @param userId The user ID
 * @returns [categories, isLoading, error]
 */
export function useRealtimeCategories(userId: string): [Category[], boolean, Error | null] {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch initial categories
  useEffect(() => {
    let mounted = true

    async function fetchCategories() {
      if (!userId) return

      try {
        setIsLoading(true)
        const supabase = createBrowserClient()
        const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId).order("name")

        if (error) throw error

        if (mounted) {
          setCategories(data || [])
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch categories"))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCategories()

    return () => {
      mounted = false
    }
  }, [userId])

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((payload: Category) => {
    setCategories((currentCategories) => {
      // Check if this is an update to an existing category
      const index = currentCategories.findIndex((c) => c.id === payload.id)

      if (index >= 0) {
        // Update existing category
        const updatedCategories = [...currentCategories]
        updatedCategories[index] = payload
        return updatedCategories
      } else {
        // Add new category
        return [...currentCategories, payload].sort((a, b) => a.name.localeCompare(b.name))
      }
    })
  }, [])

  // Handle real-time deletions
  const handleRealtimeDelete = useCallback((id: string) => {
    setCategories((currentCategories) => currentCategories.filter((c) => c.id !== id))
  }, [])

  // Subscribe to real-time updates
  const [isConnected, subscriptionError] = useRealtimeUserData<any>("categories", userId, (payload) => {
    if (payload) {
      handleRealtimePayload<Category>(payload, handleRealtimeUpdate, handleRealtimeDelete)
    }
  })

  // Update error state if subscription fails
  useEffect(() => {
    if (subscriptionError) {
      setError(subscriptionError)
    }
  }, [subscriptionError])

  return [categories, isLoading, error]
}

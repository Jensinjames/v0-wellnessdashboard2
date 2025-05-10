"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseClient, cleanupOrphanedClients } from "@/lib/supabase-client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * A hook that safely provides access to the Supabase client
 * Ensures only one client instance is created and properly cleaned up
 */
export function useSafeSupabase() {
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isMounted = useRef(true)

  // Initialize the client
  useEffect(() => {
    async function initializeClient() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = await getSupabaseClient()

        if (isMounted.current) {
          setClient(supabase)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error initializing Supabase client:", err)
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsLoading(false)
        }
      }
    }

    initializeClient()

    // Clean up function
    return () => {
      isMounted.current = false
      // Clean up orphaned clients when component unmounts
      cleanupOrphanedClients()
    }
  }, [])

  // Force refresh the client
  const refreshClient = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Force a new client
      const supabase = await getSupabaseClient({ forceNew: true })

      if (isMounted.current) {
        setClient(supabase)
        setIsLoading(false)
      }

      return true
    } catch (err) {
      console.error("Error refreshing Supabase client:", err)
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
      return false
    }
  }, [])

  return {
    client,
    isLoading,
    error,
    refreshClient,
  }
}

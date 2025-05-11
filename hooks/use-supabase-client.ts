/**
 * Supabase Client Hook
 *
 * This hook provides access to the Supabase client singleton
 * and ensures only one instance is used throughout the application.
 */
"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient, getSupabaseDebugInfo, resetSupabaseClient } from "@/lib/supabase-singleton-manager"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("SupabaseHook")

export function useSupabaseClient() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [debugInfo, setDebugInfo] = useState(getSupabaseDebugInfo())

  useEffect(() => {
    let isMounted = true

    const initializeSupabase = async () => {
      try {
        setIsLoading(true)
        const client = await Promise.resolve(getSupabaseClient())

        if (isMounted) {
          setSupabase(client)
          setError(null)
          setDebugInfo(getSupabaseDebugInfo())
        }
      } catch (err) {
        if (isMounted) {
          logger.error("Error initializing Supabase client:", err)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeSupabase()

    // Set up a periodic debug info refresh
    const debugInfoInterval = setInterval(() => {
      if (isMounted) {
        setDebugInfo(getSupabaseDebugInfo())
      }
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(debugInfoInterval)
    }
  }, [])

  const reset = () => {
    resetSupabaseClient()
    setSupabase(null)
    setIsLoading(true)
    setError(null)

    // Re-initialize after reset
    Promise.resolve(getSupabaseClient())
      .then((client) => {
        setSupabase(client)
        setIsLoading(false)
        setDebugInfo(getSupabaseDebugInfo())
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      })
  }

  return {
    supabase,
    isLoading,
    error,
    reset,
    debugInfo,
  }
}

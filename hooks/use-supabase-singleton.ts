"use client"

import { useState, useEffect } from "react"
import { getSupabaseSingleton, resetSupabaseSingleton, getSupabaseSingletonDebugInfo } from "@/lib/supabase-singleton"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export function useSupabaseSingleton() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const initializeSupabase = async () => {
      try {
        setIsLoading(true)
        const client = await Promise.resolve(getSupabaseSingleton())

        if (isMounted) {
          setSupabase(client)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error initializing Supabase singleton:", err)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeSupabase()

    return () => {
      isMounted = false
    }
  }, [])

  const reset = () => {
    resetSupabaseSingleton()
    setSupabase(null)
    setIsLoading(true)
    setError(null)

    // Re-initialize after reset
    Promise.resolve(getSupabaseSingleton())
      .then((client) => {
        setSupabase(client)
        setIsLoading(false)
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
    debugInfo: getSupabaseSingletonDebugInfo(),
  }
}

// Export the instance count for external monitoring
export const instanceCount = () => getSupabaseSingletonDebugInfo().instanceCount

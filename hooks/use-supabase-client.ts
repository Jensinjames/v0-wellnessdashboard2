"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase-singleton"

/**
 * Options for the useSupabaseClient hook
 */
interface UseSupabaseClientOptions {
  /**
   * Whether to automatically handle and display errors
   * @default true
   */
  withErrorHandling?: boolean

  /**
   * Whether to periodically check the connection status
   * @default true
   */
  withConnectionCheck?: boolean

  /**
   * Whether to use the singleton pattern from supabase-singleton
   * @default true
   */
  useSingleton?: boolean

  /**
   * Interval in milliseconds for connection checks
   * @default 30000 (30 seconds)
   */
  connectionCheckInterval?: number
}

/**
 * Result type for Supabase queries
 */
export type QueryResult<T> = {
  data: T | null
  error: Error | null
  isLoading?: boolean
}

/**
 * Hook for interacting with Supabase
 *
 * Provides a Supabase client instance with connection monitoring,
 * error handling, and helper functions for common operations.
 */
export function useSupabaseClient(options: UseSupabaseClientOptions = {}) {
  const {
    withErrorHandling = true,
    withConnectionCheck = true,
    useSingleton = true,
    connectionCheckInterval = 30000,
  } = options

  // Use the singleton pattern or create a new client
  const [supabase] = useState<SupabaseClient<Database>>(() => {
    if (useSingleton) {
      return getSupabaseClient() as SupabaseClient<Database>
    } else {
      return createClientComponentClient<Database>()
    }
  })

  const [isConnected, setIsConnected] = useState(true)
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(null)
  const connectionCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Check connection status
  const checkConnection = useCallback(async () => {
    try {
      // Simple ping to check connection
      const { error } = await supabase.from("wellness_categories").select("count").limit(1).single()

      // If we get an error about no rows, that's fine - it means the connection works
      // Any other error indicates a connection issue
      if (error && !error.message.includes("Results contain 0 rows")) {
        console.warn("Supabase connection check failed:", error)
        setIsConnected(false)

        if (withErrorHandling) {
          toast({
            title: "Connection issue",
            description: "There was a problem connecting to the database. Some features may be unavailable.",
            variant: "destructive",
          })
        }
      } else {
        // If we were previously disconnected, show a success toast
        if (!isConnected && withErrorHandling) {
          toast({
            title: "Connection restored",
            description: "Database connection has been restored.",
            variant: "default",
          })
        }
        setIsConnected(true)
      }

      setLastConnectionCheck(new Date())
    } catch (err) {
      console.error("Error checking Supabase connection:", err)
      setIsConnected(false)
    }
  }, [supabase, toast, withErrorHandling, isConnected])

  // Set up connection monitoring
  useEffect(() => {
    if (!withConnectionCheck) return

    // Check immediately
    checkConnection()

    // Then check periodically
    connectionCheckTimerRef.current = setInterval(checkConnection, connectionCheckInterval)

    // Also check when the window regains focus
    const handleFocus = () => {
      // Only check if it's been more than 5 seconds since the last check
      if (!lastConnectionCheck || new Date().getTime() - lastConnectionCheck.getTime() > 5000) {
        checkConnection()
      }
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      if (connectionCheckTimerRef.current) {
        clearInterval(connectionCheckTimerRef.current)
      }
      window.removeEventListener("focus", handleFocus)
    }
  }, [checkConnection, withConnectionCheck, connectionCheckInterval, lastConnectionCheck])

  /**
   * Helper function to execute queries with error handling
   */
  const query = useCallback(
    async <T>(\
      queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>
    ): Promise<QueryResult<T>> => {
  if (!isConnected) {
    return {
      data: null,
      error: new Error("Database connection is currently unavailable"),
    }
  }

  try {
    const result = await queryFn(supabase)

    if (result.error && withErrorHandling) {
      console.error("Supabase query error:", result.error)
      toast({
        title: "Error",
        description: result.error.message || "An error occurred while fetching data",
        variant: "destructive",
      })
    }

    return {
      data: result.data,
      error: result.error,
    }
  } catch (err: any) {
    console.error("Error executing Supabase query:", err)

    if (withErrorHandling) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    }

    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    }
  }
}
,
    [supabase, isConnected, toast, withErrorHandling]
  )

/**
 * Execute a query with loading state
 */
const queryWithLoading = useCallback(
    async <T>(
      queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>,
      setLoading?: (loading: boolean) => void
    ): Promise<QueryResult<T>> => {
if (setLoading) setLoading(true)

try {
  const result = await query(queryFn)
  return result
} finally {
  if (setLoading) setLoading(false)
}
},
    [query]
  )

/**
 * Force a connection check
 */
const forceConnectionCheck = useCallback(() => {
  return checkConnection()
}, [checkConnection])

return {
    supabase,
    isConnected,
    lastConnectionCheck,
    query,
    queryWithLoading,
    forceConnectionCheck
  }
}

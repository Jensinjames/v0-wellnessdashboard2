/**
 * Simplified Supabase Query Hook
 *
 * This hook provides a streamlined way to execute Supabase queries with
 * proper error handling and connection monitoring.
 */
"use client"

import { useCallback } from "react"
import { getSupabaseClient, checkSupabaseConnection, getConnectionHealth } from "@/lib/supabase-client"
import { useAuth } from "@/context/auth-context"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseQuery")

type QueryOptions = {
  retry?: boolean
  maxRetries?: number
  timeout?: number
  requiresAuth?: boolean
}

export function useSupabaseQuery() {
  const { user } = useAuth()
  const connectionHealth = getConnectionHealth()

  // Execute a Supabase query with optimized parameters
  const executeQuery = useCallback(
    async function query<T>(
      queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<T>,
      options: QueryOptions = {},
    ): Promise<T> {
      const { retry = true, maxRetries = 3, timeout = 10000, requiresAuth = false } = options

      // Check auth requirement
      if (requiresAuth && !user) {
        throw new Error("Authentication required for this operation")
      }

      // Get a client with the specified timeout
      const supabase = getSupabaseClient()
      let retryCount = 0

      while (true) {
        try {
          // Execute the query
          const result = await queryFn(supabase)
          return result
        } catch (error: any) {
          // Handle network errors with retry
          if (
            retry &&
            retryCount < maxRetries &&
            ((error instanceof TypeError && error.message.includes("Failed to fetch")) ||
              (error instanceof DOMException && error.name === "AbortError"))
          ) {
            // Calculate backoff time - exponential with jitter
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
            logger.info(`Network error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

            // Wait for the backoff period
            await new Promise((resolve) => setTimeout(resolve, backoffTime))

            retryCount++
            continue
          }

          // Handle other errors
          logger.error("Error in query:", error)
          throw error
        }
      }
    },
    [user],
  )

  // Check connection health
  const checkConnection = useCallback(async (): Promise<boolean> => {
    return await checkSupabaseConnection()
  }, [])

  return {
    executeQuery,
    connectionHealth,
    checkConnection,
  }
}

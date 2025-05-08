"use client"

// Custom hook for Supabase interactions with error handling and offline support
import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client-core"

const logger = createLogger("useSupabase")

// Generate a unique ID for each hook instance
let instanceCounter = 0

export function useSupabase() {
  const hookInstanceId = ++instanceCounter
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [lastActivity, setLastActivity] = useState<Date>(new Date())

  // Set up online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      logger.info(`Network connection restored (instance ${hookInstanceId})`)
      setIsOnline(true)
    }

    const handleOffline = () => {
      logger.warn(`Network connection lost (instance ${hookInstanceId})`)
      setIsOnline(false)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [hookInstanceId])

  // Execute a Supabase query with error handling and offline support
  const query = useCallback(
    async <T,>(
      queryFn: (client: SupabaseClient<Database>) => Promise<T>,
      options: {
        retries?: number
        retryDelay?: number
        requiresAuth?: boolean
        offlineAction?: () => Promise<T>
      } = {},
    ): Promise<T> => {
      const { retries = 1, retryDelay = 1000, requiresAuth = false, offlineAction } = options

      setLastActivity(new Date())

      // Handle offline state
      if (!isOnline) {
        logger.warn(`Attempted to execute query while offline (instance ${hookInstanceId})`)

        if (offlineAction) {
          logger.info(`Executing offline fallback action (instance ${hookInstanceId})`)
          return offlineAction()
        }

        throw new Error("Network is offline and no offline action was provided")
      }

      // Get the client from our consolidated implementation
      const client = getSupabaseClient()

      // Check authentication if required
      if (requiresAuth) {
        const {
          data: { session },
        } = await client.auth.getSession()
        if (!session) {
          logger.error(`Authentication required but no session found (instance ${hookInstanceId})`)
          throw new Error("Authentication required")
        }
      }

      // Execute query with retries
      let lastError: Error | null = null
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            logger.info(`Retrying query (attempt ${attempt}/${retries}, instance ${hookInstanceId})`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)))
          }

          return await queryFn(client)
        } catch (error: any) {
          lastError = error
          logger.error(`Query error (attempt ${attempt}/${retries}, instance ${hookInstanceId}):`, error)
        }
      }

      throw lastError || new Error("Query failed after retries")
    },
    [isOnline, hookInstanceId],
  )

  return {
    query,
    isOnline,
    lastActivity,
    instanceId: hookInstanceId,
    client: getSupabaseClient, // Provide direct access to client if needed
  }
}

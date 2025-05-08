/**
 * Enhanced Supabase Hook
 * Provides a React hook for using Supabase with additional features
 */
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getSupabase, addAuthListener } from "@/lib/supabase-manager"
import { clientEnv } from "@/lib/env"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("SupabaseHook")

// Network status detection
const NETWORK_DETECTION_INTERVAL = 10000 // 10 seconds
const PING_TIMEOUT = 5000 // 5 seconds

interface UseSupabaseOptions {
  debugMode?: boolean
  monitorNetwork?: boolean
}

export function useSupabase(options: UseSupabaseOptions = {}) {
  const { debugMode = clientEnv.DEBUG_MODE === "true", monitorNetwork = true } = options

  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const clientRef = useRef<SupabaseClient<Database> | null>(null)
  const networkCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pingInProgressRef = useRef(false)
  const hookInstanceId = useRef(`supabase-hook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)

  // Debug logging
  const debug = useCallback(
    (...args: any[]) => {
      if (debugMode) {
        logger.debug(...args)
      }
    },
    [debugMode],
  )

  // Initialize the Supabase client
  useEffect(() => {
    if (isInitialized) return

    try {
      logger.info(`Initializing Supabase client (${hookInstanceId.current})`)
      const client = getSupabase()
      clientRef.current = client
      setIsInitialized(true)
      logger.info(`Supabase client initialized (${hookInstanceId.current})`)
    } catch (error) {
      logger.error(`Error initializing Supabase client (${hookInstanceId.current})`, {}, error)

      toast({
        title: "Connection Error",
        description: "Failed to initialize database connection. Please refresh the page.",
        variant: "destructive",
      })
    }

    // Cleanup function
    return () => {
      logger.debug(`Cleaning up Supabase hook (${hookInstanceId.current})`)
    }
  }, [debug, toast, isInitialized, hookInstanceId])

  // Set up network status detection
  useEffect(() => {
    if (!isInitialized || !monitorNetwork) return

    const updateOnlineStatus = () => {
      const wasOnline = isOnline
      const nowOnline = navigator.onLine

      if (wasOnline !== nowOnline) {
        logger.info(
          `Network status changed: ${nowOnline ? "online" : "offline"}`,
          { wasOnline, nowOnline },
          { hookInstanceId: hookInstanceId.current },
        )

        setIsOnline(nowOnline)

        if (nowOnline) {
          // We're back online
          toast({
            title: "Back online",
            description: "Your connection has been restored.",
            duration: 3000,
          })
        } else {
          // We're offline
          toast({
            title: "You are offline",
            description: "Some features may be unavailable until your connection is restored.",
            variant: "warning",
            duration: 5000,
          })
        }
      }
    }

    // Active ping to check real connectivity
    const checkConnectivity = async () => {
      if (pingInProgressRef.current) return

      try {
        pingInProgressRef.current = true
        logger.debug("Performing connectivity check")

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT)

        const response = await fetch("/api/health-check", {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const nowOnline = response.ok
        if (isOnline !== nowOnline) {
          logger.info(
            `Connectivity check: ${nowOnline ? "online" : "offline"}`,
            { wasOnline: isOnline, nowOnline },
            { hookInstanceId: hookInstanceId.current },
          )

          setIsOnline(nowOnline)

          if (!nowOnline) {
            toast({
              title: "Connection issues detected",
              description: "You appear to be offline. Some features may be unavailable.",
              variant: "warning",
              duration: 5000,
            })
          } else if (!isOnline && nowOnline) {
            toast({
              title: "Connection restored",
              description: "You're back online.",
              duration: 3000,
            })
          }
        }
      } catch (error) {
        // If we get an error, we're likely offline
        if (isOnline) {
          logger.warn(
            "Connectivity check failed, assuming offline",
            { error: error instanceof Error ? error.message : String(error) },
            { hookInstanceId: hookInstanceId.current },
          )

          setIsOnline(false)

          toast({
            title: "Connection issues detected",
            description: "You appear to be offline. Some features may be unavailable.",
            variant: "warning",
            duration: 5000,
          })
        }
      } finally {
        pingInProgressRef.current = false
      }
    }

    // Start network monitoring
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Periodic connectivity check
    networkCheckTimerRef.current = setInterval(checkConnectivity, NETWORK_DETECTION_INTERVAL)

    // Initial check
    updateOnlineStatus()
    checkConnectivity()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)

      if (networkCheckTimerRef.current) {
        clearInterval(networkCheckTimerRef.current)
        networkCheckTimerRef.current = null
      }
    }
  }, [isInitialized, monitorNetwork, debug, isOnline, toast, setIsOnline, hookInstanceId])

  // Set up activity tracking
  useEffect(() => {
    if (!isInitialized) return

    const trackActivity = () => {
      setLastActivity(Date.now())
    }

    // Track user activity
    window.addEventListener("click", trackActivity)
    window.addEventListener("keypress", trackActivity)
    window.addEventListener("scroll", trackActivity)
    window.addEventListener("mousemove", trackActivity)

    return () => {
      window.removeEventListener("click", trackActivity)
      window.removeEventListener("keypress", trackActivity)
      window.removeEventListener("scroll", trackActivity)
      window.removeEventListener("mousemove", trackActivity)

      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current)
      }
    }
  }, [isInitialized, lastActivity, setLastActivity])

  // Set up auth state change listener
  useEffect(() => {
    if (!isInitialized) return

    const removeListener = addAuthListener((event, payload) => {
      logger.info(`Auth state change: ${event}`, { event, payload }, { hookInstanceId: hookInstanceId.current })
    })

    return () => {
      removeListener()
    }
  }, [isInitialized, debug, hookInstanceId])

  // Wrap Supabase queries with error handling
  const query = useCallback(
    async <T>(\
      queryFn: (client: SupabaseClient<Database>) => Promise<T>,
      options: {
        retries?: number
        retryDelay?: number
        requiresAuth?: boolean
        offlineAction?: () => Promise<T>
}
=
{
}
): Promise<T> =>
{
  const { retries = 3, retryDelay = 1000, requiresAuth = false, offlineAction } = options

  if (!clientRef.current) {
    const error = new Error("Supabase client not initialized")
    logger.error("Query failed: Supabase client not initialized", { options }, error, {
      hookInstanceId: hookInstanceId.current,
    })
    throw error
  }

  // Check if we're offline and have an offline action
  if (!isOnline && offlineAction) {
    logger.info("Executing offline action", { options }, { hookInstanceId: hookInstanceId.current })
    return offlineAction()
  }

  let attempt = 0
  let lastError: any

  while (attempt < retries) {
    try {
      // Track activity on each query
      setLastActivity(Date.now())

      // Log the query attempt
      logger.debug(
        `Executing query${attempt > 0 ? ` (attempt ${attempt + 1}/${retries})` : ""}`,
        { options },
        { hookInstanceId: hookInstanceId.current, attempt: attempt + 1, maxRetries: retries },
      )

      // Execute the query
      const result = await queryFn(clientRef.current)

      // Log success
      logger.debug(
        "Query completed successfully",
        { options },
        { hookInstanceId: hookInstanceId.current, attempts: attempt + 1 },
      )

      return result
    } catch (error: any) {
      lastError = error
      attempt++

      // Check for network errors and update online status
      if (
        error.message?.includes("network") ||
        error.message?.includes("fetch") ||
        error.message?.includes("Failed to fetch")
      ) {
        logger.warn(
          "Network error detected during query",
          { error: error.message },
          { hookInstanceId: hookInstanceId.current, attempt, retries },
        )

        setIsOnline(false)

        // If we have an offline action, use it
        if (offlineAction) {
          logger.info(
            "Executing offline fallback action after network error",
            { options },
            { hookInstanceId: hookInstanceId.current },
          )
          return offlineAction()
        }
      }

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt - 1)
        logger.info(
          `Query failed, retrying in ${delay}ms`,
          { error: error.message, attempt, retries, delay },
          { hookInstanceId: hookInstanceId.current },
        )

        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        logger.error("Query failed after all retry attempts", { options, attempts: attempt }, error, {
          hookInstanceId: hookInstanceId.current,
        })
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError
}
,
    [isOnline, debug, setIsOnline, setLastActivity, hookInstanceId, isOnline]
  )

return {
    supabase: clientRef.current,
    isInitialized,
    isOnline,
    query,
  }
}

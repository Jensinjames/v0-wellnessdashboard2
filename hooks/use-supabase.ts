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

  // Debug logging
  const debug = useCallback(
    (...args: any[]) => {
      if (debugMode) {
        console.log("[useSupabase]", ...args)
      }
    },
    [debugMode],
  )

  // Initialize the Supabase client
  useEffect(() => {
    if (isInitialized) return

    try {
      debug("Initializing Supabase client")
      const client = getSupabase()
      clientRef.current = client
      setIsInitialized(true)
      debug("Supabase client initialized")
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      toast({
        title: "Connection Error",
        description: "Failed to initialize database connection. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [debug, toast, isInitialized])

  // Set up network status detection
  useEffect(() => {
    if (!isInitialized || !monitorNetwork) return

    const updateOnlineStatus = () => {
      const wasOnline = isOnline
      const nowOnline = navigator.onLine

      if (wasOnline !== nowOnline) {
        debug(`Network status changed: ${nowOnline ? "online" : "offline"}`)
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
          debug(`Connectivity check: ${nowOnline ? "online" : "offline"}`)
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
          debug("Connectivity check failed, assuming offline:", error)
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
  }, [isInitialized, monitorNetwork, debug, isOnline, toast, setIsOnline])

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
      debug("Auth state change:", event, payload)
    })

    return () => {
      removeListener()
    }
  }, [isInitialized, debug])

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
    throw new Error("Supabase client not initialized")
  }

  // Check if we're offline and have an offline action
  if (!isOnline && offlineAction) {
    debug("Executing offline action")
    return offlineAction()
  }

  let attempt = 0
  let lastError: any

  while (attempt < retries) {
    try {
      // Track activity on each query
      setLastActivity(Date.now())

      // Execute the query
      const result = await queryFn(clientRef.current)
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
        debug("Network error detected, updating online status")
        setIsOnline(false)

        // If we have an offline action, use it
        if (offlineAction) {
          debug("Executing offline fallback action")
          return offlineAction()
        }
      }

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt - 1)
        debug(`Query failed, retrying in ${delay}ms (attempt ${attempt}/${retries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError
}
,
    [isOnline, debug, setIsOnline, setLastActivity]
  )

return {
    supabase: clientRef.current,
    isInitialized,
    isOnline,
    query,
  }
}

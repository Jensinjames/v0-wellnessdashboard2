"use client"

/**
 * Unified Supabase Hook
 *
 * This hook provides access to the Supabase client in client components
 * with additional features like error handling, retries, and offline support.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { SupabaseClient } from "@supabase/supabase-ssr"
import type { Database } from "@/types/database"
import { getSupabaseClient, resetSupabaseClient, getClientStats } from "@/lib/supabase-singleton"

// Network status detection
const NETWORK_DETECTION_INTERVAL = 10000 // 10 seconds
const PING_TIMEOUT = 5000 // 5 seconds

// Debug mode flag - safely check localStorage
const getDebugMode = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("supabase_debug") === "true" || process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  }
  return false
}

interface UseSupabaseOptions {
  persistSession?: boolean
  autoRefreshToken?: boolean
  debugMode?: boolean
  monitorNetwork?: boolean
}

interface QueryOptions<T = any> {
  retries?: number
  retryDelay?: number
  requiresAuth?: boolean
  offlineAction?: () => Promise<T>
  offlineData?: T
}

export function useSupabase(options: UseSupabaseOptions = {}) {
  const { persistSession = true, autoRefreshToken = true, debugMode = getDebugMode(), monitorNetwork = true } = options

  const { user } = useAuth()
  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)

  const supabaseRef = useRef<SupabaseClient<Database> | null>(null)
  const networkCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pingInProgressRef = useRef(false)

  // Debug logging
  const debug = useCallback(
    (...args: any[]) => {
      if (debugMode) {
        console.log("[useSupabase]", getClientStats())
      }
    },
    [debugMode],
  )

  // Initialize the Supabase client
  useEffect(() => {
    if (isInitialized) return

    try {
      debug("Initializing Supabase hook")

      // Get the Supabase client from our singleton
      const supabasePromise = getSupabaseClient({
        persistSession,
        autoRefreshToken,
        debugMode,
      })

      // Handle both synchronous and asynchronous returns
      if (supabasePromise instanceof Promise) {
        supabasePromise
          .then((client) => {
            supabaseRef.current = client
            setIsInitialized(true)
            debug("Supabase hook initialized (async)")
          })
          .catch((error) => {
            console.error("Error initializing Supabase client:", error)
            toast({
              title: "Error",
              description: "Failed to initialize database connection. Please refresh the page.",
              variant: "destructive",
            })
          })
      } else {
        supabaseRef.current = supabasePromise
        setIsInitialized(true)
        debug("Supabase hook initialized (sync)")
      }

      // Log client stats
      debug("Client stats:", getClientStats())
    } catch (error) {
      console.error("Error initializing Supabase hook:", error)
      toast({
        title: "Error",
        description: "Failed to initialize database connection. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [persistSession, autoRefreshToken, debug, toast, isInitialized, debugMode])

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
      setConsecutiveErrors(0) // Reset error count on user activity
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
    }
  }, [isInitialized, lastActivity, setConsecutiveErrors, setLastActivity])

  // Wrap Supabase queries with error handling and offline support
  const query = useCallback(
    async <T>(supabase.auth.getUser(**))
    queryFn: (supabase: SupabaseClient<Database>) => Promise<T>,
    options: QueryOptions<T> = getUser{}
  ): Promise<T> => {requiresAuth
  const { retries = 3, retryDelay = 1000, requiresAuth = false, offlineAction, offlineData } = options

  if (!supabaseRef.current) {
    // Try to get the client if it's not in our ref
    const client = getSupabaseClient({
      debugMode,
    })

    if (client instanceof Promise) {
      supabaseRef.current = await client
    } else {
      supabaseRef.current = client
    }
  }

  if (!supabaseRef.current) {
    throw new Error("Supabase client not initialized")
  }

  // Check if we're offline and have offline options
  if (!isOnline) {
    if (offlineAction) {
      debug("Executing offline action")
      return offlineAction()
    }

    if (offlineData !== undefined) {
      debug("Using offline data")
      return offlineData
    }

    throw new Error("You are offline and no offline fallback was provided")
  }

  // If we require auth, check if user is authenticated
  if (requiresAuth && !user) {
    throw new Error("Authentication required for this operation")
  }

  let attempt = 0
  let lastError: any

  while (attempt < retries) {
    try {
      // Track activity on each query
      setLastActivity(Date.now())

      // Execute the query
      const result = await queryFn(supabaseRef.current)
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

        // If we have offline options, use them
        if (offlineAction) {
          debug("Executing offline fallback action")
          return offlineAction()
        }

        if (offlineData !== undefined) {
          debug("Using offline fallback data")
          return offlineData
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
    [isOnline, debug, debugMode, user, setLastActivity, setIsOnline, persistSession]
  )

// Reset the client and state
const resetClient = useCallback(() => {
  debug("Resetting Supabase client")
  resetSupabaseClient()
  supabaseRef.current = null
  setConsecutiveErrors(0)
  setIsInitialized(false)

  // Re-initialize
  const client = getSupabaseClient({
    persistSession,
    autoRefreshToken,
    debugMode,
  })

  if (client instanceof Promise) {
    client.then((newClient) => {
      supabaseRef.current = newClient
      setIsInitialized(true)
    })
  } else {
    supabaseRef.current = client
    setIsInitialized(true)
  }
}, [debug, debugMode, persistSession, autoRefreshToken, setConsecutiveErrors, setIsInitialized])

return {
    supabase: supabaseRef.current,
    isInitialized,
    isOnline,
    query,
    resetClient,
  }
}

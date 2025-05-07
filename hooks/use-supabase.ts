"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getTokenManager, TOKEN_EVENTS, resetTokenManager } from "@/lib/token-manager"

// Network status detection
const NETWORK_DETECTION_INTERVAL = 10000 // 10 seconds
const PING_TIMEOUT = 5000 // 5 seconds
const OFFLINE_MODE_STORAGE_KEY = "supabase_offline_mode"
const AUTH_DEBUG_STORAGE_KEY = "auth_debug_mode"

// Default to false in production, true in development
const DEFAULT_DEBUG_MODE = false

interface UseSupabaseOptions {
  persistSession?: boolean
  autoRefreshToken?: boolean
  debugMode?: boolean
  monitorNetwork?: boolean
  offlineMode?: boolean
}

// Define interface for query options to improve type safety
interface QueryOptions<T> {
  retries?: number
  retryDelay?: number
  requiresAuth?: boolean
  offlineAction?: (...args: any[]) => Promise<T>
  offlineArgs?: any
}

export function useSupabase(options: UseSupabaseOptions = {}) {
  const {
    persistSession = true,
    autoRefreshToken = true,
    debugMode = DEFAULT_DEBUG_MODE,
    monitorNetwork = true,
    offlineMode = false,
  } = options

  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [tokenStatus, setTokenStatus] = useState<{ valid: boolean; expiresAt: number | null }>({
    valid: false,
    expiresAt: null,
  })

  const clientRef = useRef<SupabaseClient<Database> | null>(null)
  const tokenManagerRef = useRef<ReturnType<typeof getTokenManager> | null>(null)
  const networkCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const activityTimerRef = useRef(false)
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

      // Try to read debug mode preference from storage
      try {
        const storedDebugMode = localStorage.getItem(AUTH_DEBUG_STORAGE_KEY)
        if (storedDebugMode === "true") {
          debug("Debug mode enabled from local storage")
        }
      } catch (e) {
        // Ignore storage errors
      }

      // Create client with enhanced options
      clientRef.current = createClientComponentClient<Database>({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        options: {
          auth: {
            persistSession,
            autoRefreshToken,
            storageKey: "supabase-auth-token-v2",
            flowType: "pkce",
            debug: debugMode,
          },
          global: {
            headers: {
              "x-client-info": `useSupabase-hook/${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`,
            },
          },
        },
      })

      // Initialize token manager
      if (clientRef.current) {
        tokenManagerRef.current = getTokenManager(clientRef.current, debugMode)

        // Get initial token status
        const status = tokenManagerRef.current.getStatus()
        setTokenStatus({
          valid: status.valid,
          expiresAt: status.expiresAt,
        })
      }

      setIsInitialized(true)
      debug("Supabase client initialized")
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      toast({
        title: "Error",
        description: "Failed to initialize database connection. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [persistSession, autoRefreshToken, debug, toast, isInitialized, debugMode])

  // Set up token event listeners
  useEffect(() => {
    if (!isInitialized) return

    // Handle token refresh events
    const handleRefreshSuccess = (e: CustomEvent) => {
      debug("Token refreshed successfully", e.detail)
      setConsecutiveErrors(0)

      if (tokenManagerRef.current) {
        const status = tokenManagerRef.current.getStatus()
        setTokenStatus({
          valid: status.valid,
          expiresAt: status.expiresAt,
        })
      }
    }

    const handleRefreshFailure = (e: CustomEvent) => {
      debug("Token refresh failed", e.detail)
      setConsecutiveErrors((prev) => prev + 1)

      // If we've failed too many times, show a warning
      if (consecutiveErrors >= 2) {
        toast({
          title: "Authentication Warning",
          description: "Having trouble refreshing your session. You may need to sign in again soon.",
          variant: "warning",
          duration: 10000,
        })
      }
    }

    const handleSessionExpired = () => {
      debug("Session expired, signing out")
      toast({
        title: "Session expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      })
      signOut()
    }

    // Add event listeners
    window.addEventListener(TOKEN_EVENTS.REFRESH_SUCCESS, handleRefreshSuccess as EventListener)
    window.addEventListener(TOKEN_EVENTS.REFRESH_FAILURE, handleRefreshFailure as EventListener)
    window.addEventListener(TOKEN_EVENTS.SESSION_EXPIRED, handleSessionExpired)

    // Clean up listeners on unmount
    return () => {
      window.removeEventListener(TOKEN_EVENTS.REFRESH_SUCCESS, handleRefreshSuccess as EventListener)
      window.removeEventListener(TOKEN_EVENTS.REFRESH_FAILURE, handleRefreshFailure as EventListener)
      window.removeEventListener(TOKEN_EVENTS.SESSION_EXPIRED, handleSessionExpired)
    }
  }, [isInitialized, debug, toast, signOut, consecutiveErrors])

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
          // We're back online, refresh token if necessary
          toast({
            title: "Back online",
            description: "Your connection has been restored.",
            duration: 3000,
          })

          if (tokenManagerRef.current && user) {
            tokenManagerRef.current.forceRefresh()
          }
        } else {
          // We're offline, show notification
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

            if (tokenManagerRef.current && user) {
              tokenManagerRef.current.forceRefresh()
            }
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
  }, [isInitialized, monitorNetwork, debug, isOnline, toast, user, tokenManagerRef, debugMode])

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

    // Check for inactivity every minute
    const activityCheck = () => {
      const inactiveTime = Date.now() - lastActivity
      debug(`User inactive for ${Math.round(inactiveTime / 1000)} seconds`)

      // If inactive for more than 30 minutes, refresh the token
      if (inactiveTime > 30 * 60 * 1000 && user && tokenManagerRef.current) {
        debug("User inactive for 30 minutes, refreshing token")
        tokenManagerRef.current.forceRefresh()
      }
    }

    activityTimerRef.current = setInterval(activityCheck, 60 * 1000)

    return () => {
      window.removeEventListener("click", trackActivity)
      window.removeEventListener("keypress", trackActivity)
      window.removeEventListener("scroll", trackActivity)
      window.removeEventListener("mousemove", trackActivity)

      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current)
      }
    }
  }, [isInitialized, lastActivity, user, debug, tokenManagerRef, setConsecutiveErrors])

  // Function to refresh the auth token directly
  const refreshToken = useCallback(async () => {
    if (!tokenManagerRef.current || !user) return false

    try {
      setIsRefreshing(true)
      debug("Manually refreshing auth token")

      const result = await tokenManagerRef.current.forceRefresh()

      if (result) {
        debug("Manual token refresh successful")
        setConsecutiveErrors(0)
      } else {
        debug("Manual token refresh failed")
        setConsecutiveErrors((prev) => prev + 1)
      }

      return result
    } catch (error) {
      console.error("Unexpected error refreshing token:", error)
      setConsecutiveErrors((prev) => prev + 1)
      return false
    } finally {
      setIsRefreshing(false)
    }
  }, [user, debug, tokenManagerRef, setIsRefreshing, setConsecutiveErrors])

  // Function to verify user during sign-in or sign-up
  const verifyUser = useCallback(
    async (email: string, action: "verify-signup" | "validate-user" | "get-verification-status", userId?: string) => {
      debug(`Verifying user with action: ${action}`)

      try {
        // Check for offline mode
        if (!isOnline) {
          debug("Cannot verify user while offline")
          return { error: "Cannot verify user while offline" }
        }

        // Make the call to our edge function
        const response = await fetch("/api/auth/user-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, action, userId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          debug(`User verification error: ${errorData.error}`)
          return { error: errorData.error || "User verification failed" }
        }

        const data = await response.json()
        debug(`User verification successful: ${JSON.stringify(data)}`)
        return { data, error: null }
      } catch (error: any) {
        debug(`User verification exception: ${error.message}`)
        return { data: null, error: error.message || "Unknown error during user verification" }
      }
    },
    [isOnline, debug],
  )

  // Function to check if token is valid
  const isTokenValid = useCallback(() => {
    if (!tokenManagerRef.current) return false
    return tokenManagerRef.current.isTokenValid()
  }, [tokenManagerRef])

  // Wrap Supabase queries with error handling and token validation
  const query = useCallback(
    async <T>(\
      queryFn: (client: SupabaseClient<Database>) => Promise<T>,
      options: QueryOptions<T> = {}
    ): Promise<T> => {
  const { retries = 3, retryDelay = 1000, requiresAuth = false, offlineAction, offlineArgs } = options

  if (!clientRef.current) {
    throw new Error("Supabase client not initialized")
  }

  // Check if we're offline and have an offline action
  if (!isOnline && offlineAction) {
    debug("Executing offline action")
    if (offlineArgs) {
      return offlineAction(offlineArgs)
    }
    return offlineAction()
  }

  // If we require auth, check token validity first
  if (requiresAuth && tokenManagerRef.current) {
    if (!tokenManagerRef.current.isTokenValid()) {
      debug("Token invalid or expired, attempting refresh before query")
      const refreshed = await tokenManagerRef.current.forceRefresh()
      if (!refreshed) {
        throw new Error("Authentication required for this operation. Please sign in again.")
      }
    }
  }

  let attempt = 0
  let lastError: any

  while (attempt < retries) {
    try {
      // Track activity on each query
      setLastActivity(Date.now())

      // Execute the query
      const asyncResult = await queryFn(clientRef.current)
      return asyncResult
    } catch (error: any) {
      lastError = error
      attempt++

      // Check for auth errors
      if (error.message?.includes("JWT") || error.message?.includes("token") || error.status === 401) {
        debug(`Auth error on attempt ${attempt}, refreshing token`)

        if (tokenManagerRef.current) {
          await tokenManagerRef.current.forceRefresh()
        }
      }

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
          if (offlineArgs) {
            return offlineAction(offlineArgs)
          }
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
    [isOnline, debug, clientRef, setLastActivity, setIsOnline, tokenManagerRef]
  )

// Get detailed token status
const getTokenStatus = useCallback(() => {
  if (!tokenManagerRef.current) {
    return {
      valid: false,
      expiresSoon: false,
      expiresAt: null,
      refreshAttempts: 0,
      lastRefresh: null,
    }
  }

  const status = tokenManagerRef.current.getStatus()
  return {
    valid: status.valid,
    expiresSoon: status.expiresSoon,
    expiresAt: status.expiresAt,
    refreshAttempts: status.telemetry.refreshAttempts,
    lastRefresh: status.telemetry.lastRefreshSuccess,
    successRate: status.telemetry.successCount / (status.telemetry.successCount + status.telemetry.failureCount || 1),
  }
}, [tokenManagerRef])

// Reset all auth and token state (useful for debugging or troubleshooting)
const resetAuthState = useCallback(() => {
  debug("Resetting auth state")
  resetTokenManager()
  tokenManagerRef.current = null

  if (clientRef.current) {
    tokenManagerRef.current = getTokenManager(clientRef.current, debugMode)
  }

  // After resetting, refresh connection status
  setConsecutiveErrors(0)

  if (isOnline && tokenManagerRef.current) {
    tokenManagerRef.current.forceRefresh()
  }
}, [debug, debugMode, isOnline, clientRef, tokenManagerRef, setConsecutiveErrors])

// Optimized user profile query with caching and offline support
const getUserProfile = useCallback(
  async (userId: string, options: { force?: boolean; cacheTime?: number } = {}) => {
    const { force = false, cacheTime = 5 * 60 * 1000 } = options

    // Check cache first
    if (!force && typeof window !== "undefined") {
      try {
        const cachedProfile = localStorage.getItem(`user_profile:${userId}`)
        const cacheTimestamp = localStorage.getItem(`user_profile_time:${userId}`)

        if (cachedProfile && cacheTimestamp) {
          const timestamp = Number.parseInt(cacheTimestamp, 10)
          const now = Date.now()

          // If cache is fresh enough, use it
          if (now - timestamp < cacheTime) {
            debug("Using cached user profile")
            return { data: JSON.parse(cachedProfile), error: null, source: "cache" }
          }
        }
      } catch (e) {
        // Ignore cache errors
        debug("Error reading profile cache:", e)
      }
    }

    // If we're offline, return cached data or error
    if (!isOnline) {
      try {
        const cachedProfile = localStorage.getItem(`user_profile:${userId}`)
        if (cachedProfile) {
          debug("Offline: using cached profile data")
          return { data: JSON.parse(cachedProfile), error: null, source: "cache-offline" }
        }
      } catch (e) {
        // Ignore cache errors
      }

      return { data: null, error: "Cannot fetch profile while offline", source: "error-offline" }
    }

    // Get fresh data, using our validation edge function
    try {
      const result = await verifyUser("", "validate-user", userId)

      if (result.error) {
        return { data: null, error: result.error, source: "api" }
      }

      // Cache the result
      if (typeof window !== "undefined" && result.data?.profile) {
        try {
          localStorage.setItem(`user_profile:${userId}`, JSON.stringify(result.data.profile))
          localStorage.setItem(`user_profile_time:${userId}`, Date.now().toString())
        } catch (e) {
          // Ignore cache errors
        }
      }

      return { data: result.data?.profile, error: null, source: "api" }
    } catch (error: any) {
      debug(`Error fetching user profile: ${error.message}`)
      return { data: null, error: error.message || "Failed to fetch user profile", source: "error" }
    }
  },
  [isOnline, debug, verifyUser],
)

return {
  supabase: clientRef.current,
  isInitialized,
  isOnline,
  refreshToken,
  isTokenValid,
  query,
  getTokenStatus,
  resetAuthState,
  tokenStatus,
  verifyUser,    // Add this line
  getUserProfile // Add this line
}
}

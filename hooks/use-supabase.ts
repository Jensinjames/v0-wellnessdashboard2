"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getTokenManager } from "@/lib/token-manager"

interface QueryOptions {
  retries?: number
  retryDelay?: number
  requiresAuth?: boolean
  offlineAction?: (args: any) => any
  offlineArgs?: any
}

interface UseSupabaseOptions {
  debugMode?: boolean
}

/**
 * A hook that safely provides access to the Supabase client and token management
 * Ensures only one client instance is created and properly cleaned up
 */
export function useSupabase(options: UseSupabaseOptions = {}) {
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const clientRef = useRef<SupabaseClient<Database> | null>(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  // Token manager
  const [tokenManager, setTokenManager] = useState<ReturnType<typeof getTokenManager> | null>(null)

  // Initialize Supabase client
  useEffect(() => {
    let cleanupFn: (() => void) | undefined

    const initializeClient = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClientComponentClient<Database>()
        clientRef.current = supabase
        setClient(supabase)

        // Initialize token manager
        const tm = getTokenManager(supabase, options.debugMode)
        setTokenManager(tm)
        cleanupFn = tm.cleanup

        setIsLoading(false)
      } catch (err) {
        console.error("Error initializing Supabase client:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }

    initializeClient()

    // Cleanup function
    return () => {
      cleanupFn?.()
    }
  }, [options.debugMode])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!tokenManager) return false
    return tokenManager.refreshToken()
  }, [tokenManager])

  // Get token status
  const getTokenStatus = useCallback(() => {
    if (!tokenManager) {
      return {
        valid: false,
        expiresSoon: false,
        expiresAt: null,
        telemetry: {
          refreshAttempts: 0,
          lastRefreshAttempt: 0,
          lastRefreshSuccess: null,
          successCount: 0,
          failureCount: 0,
        },
      }
    }
    return tokenManager.getStatus()
  }, [tokenManager])

  // Reset auth state
  const resetAuthState = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.auth.signOut()
    }
  }, [])

  return {
    supabase: client,
    isInitialized: !!client,
    isLoading,
    error,
    query: () => Promise.reject("Query function not implemented"),
    refreshToken,
    getTokenStatus,
    isOnline,
    resetAuthState,
  }
}

export default useSupabase

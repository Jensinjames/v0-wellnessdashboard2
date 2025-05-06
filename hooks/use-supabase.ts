"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getSupabaseClient,
  checkSupabaseConnection,
  getConnectionHealth,
  resetSupabaseClient,
  setDebugMode,
} from "@/lib/supabase-client"
import { useAuth } from "@/context/auth-context"
import { setCacheItem, getCacheItem, CACHE_EXPIRY } from "@/lib/cache-utils"

// Types for the hook options
type QueryOptions = {
  // Caching options
  cacheKey?: string
  cacheExpiry?: number
  skipCache?: boolean

  // Retry options
  retry?: boolean
  maxRetries?: number
  timeout?: number

  // Batching options
  batchable?: boolean
  priority?: "high" | "medium" | "low"
  category?: string

  // Lifecycle callbacks
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onNetworkError?: () => void
  onRateLimit?: () => void

  // Query control
  enabled?: boolean
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
}

// Query state type
type QueryState<T> = {
  data: T | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isNetworkError: boolean
  isRateLimited: boolean
  isCached: boolean
  retryCount: number
}

// Batch manager type (simplified version of your existing batch manager)
type BatchStatus = "idle" | "pending" | "success" | "error" | "rate-limited" | "network-error"

// Debug mode flag
let isDebugMode = false

/**
 * Unified Supabase hook that combines caching, batching, and optimized fetching
 */
export function useSupabase() {
  const { user } = useAuth()
  const [connectionHealth, setConnectionHealth] = useState(getConnectionHealth())
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [batchStatus, setBatchStatus] = useState<BatchStatus>("idle")
  const [queueLength, setQueueLength] = useState(0)

  // Enable/disable debug mode
  const setDebug = useCallback((enabled: boolean) => {
    isDebugMode = enabled
    setDebugMode(enabled)
  }, [])

  // Debug logging function
  const debugLog = useCallback((...args: any[]) => {
    if (isDebugMode) {
      console.log("[useSupabase]", ...args)
    }
  }, [])

  // Periodically check connection health
  useEffect(() => {
    // Check immediately
    checkSupabaseConnection().then((isConnected) => {
      setConnectionHealth(getConnectionHealth())
    })

    // Set up interval for health checks
    healthCheckIntervalRef.current = setInterval(() => {
      checkSupabaseConnection().then((isConnected) => {
        setConnectionHealth(getConnectionHealth())
      })
    }, 30000) // Check every 30 seconds

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current)
      }
    }
  }, [])

  // Execute a Supabase query with caching, batching, and optimized parameters
  const executeQuery = useCallback(
    async <T,>(
      queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ data: T | null; error: any }>,
      options: QueryOptions = {},
    ): Promise<{ data: T | null; error: any; isCached?: boolean }> => {
      const {
        cacheKey,
        cacheExpiry = CACHE_EXPIRY.MEDIUM,
        skipCache = false,
        retry = true,
        maxRetries = 3,
        timeout = 10000,
        onSuccess,
        onError,
        onNetworkError,
        onRateLimit,
      } = options

      debugLog("Executing query", { cacheKey, skipCache })

      // Check cache first if we have a cache key and aren't skipping cache
      if (cacheKey && !skipCache) {
        const cachedData = getCacheItem<T>(cacheKey)
        if (cachedData) {
          debugLog("Using cached data for", cacheKey)
          if (onSuccess) onSuccess(cachedData)
          return { data: cachedData, error: null, isCached: true }
        }
      }

      // Execute the query with retry logic
      let retryCount = 0

      while (true) {
        try {
          // Update batch status
          setBatchStatus("pending")

          // Get a client with the specified timeout
          const supabase = getSupabaseClient({ timeout })
          const result = await queryFn(supabase)

          if (result.error) {
            // Handle rate limiting
            if (
              result.error.status === 429 ||
              result.error.message?.includes("429") ||
              result.error.message?.includes("rate limit")
            ) {
              debugLog("Rate limit detected")
              setBatchStatus("rate-limited")
              onRateLimit?.()

              if (retry && retryCount < maxRetries) {
                // Calculate backoff time - exponential with jitter
                const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
                debugLog(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

                // Wait for the backoff period
                await new Promise((resolve) => setTimeout(resolve, backoffTime))

                retryCount++
                continue
              }
            }

            setBatchStatus("error")
            onError?.(result.error)
            return result
          }

          // Cache the result if we have a cache key
          if (cacheKey && result.data) {
            setCacheItem(cacheKey, result.data, cacheExpiry)
          }

          setBatchStatus("success")
          if (onSuccess && result.data) {
            onSuccess(result.data)
          }

          return { ...result, isCached: false }
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
            debugLog(`Network error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

            // Wait for the backoff period
            await new Promise((resolve) => setTimeout(resolve, backoffTime))

            retryCount++
            setBatchStatus("network-error")
            continue
          }

          // Handle other errors
          debugLog("Error in query:", error)
          setBatchStatus("error")
          onError?.(error)
          onNetworkError?.()

          return { data: null, error }
        }
      }
    },
    [],
  )

  // Hook for executing a query with state management
  const useQuery = <T,>(
    queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ data: T | null; error: any }>,
    options: QueryOptions & {
      initialData?: T | null
    } = {},
  ) => {
    const {
      enabled = true,
      refetchInterval,
      refetchOnWindowFocus = true,
      initialData = null,
      ...queryOptions
    } = options

    const [state, setState] = useState<QueryState<T>>({
      data: initialData,
      error: null,
      isLoading: enabled,
      isSuccess: false,
      isError: false,
      isNetworkError: false,
      isRateLimited: false,
      isCached: false,
      retryCount: 0,
    })

    const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef(true)

    const execute = useCallback(
      async (skipCache = false) => {
        if (!enabled) return

        setState((prev) => ({ ...prev, isLoading: true }))

        try {
          const result = await executeQuery<T>(queryFn, {
            ...options,
            skipCache,
            onNetworkError: () => {
              if (isMountedRef.current) {
                setState((prev) => ({ ...prev, isNetworkError: true }))
              }
              queryOptions.onNetworkError?.()
            },
            onRateLimit: () => {
              if (isMountedRef.current) {
                setState((prev) => ({ ...prev, isRateLimited: true }))
              }
              queryOptions.onRateLimit?.()
            },
          })

          if (isMountedRef.current) {
            if (result.error) {
              setState({
                data: null,
                error: result.error,
                isLoading: false,
                isSuccess: false,
                isError: true,
                isNetworkError: result.error instanceof TypeError && result.error.message.includes("Failed to fetch"),
                isRateLimited:
                  result.error.status === 429 ||
                  result.error.message?.includes("429") ||
                  result.error.message?.includes("rate limit"),
                isCached: false,
                retryCount: state.retryCount,
              })
            } else {
              setState({
                data: result.data,
                error: null,
                isLoading: false,
                isSuccess: true,
                isError: false,
                isNetworkError: false,
                isRateLimited: false,
                isCached: !!result.isCached,
                retryCount: 0,
              })
            }
          }
        } catch (error: any) {
          if (isMountedRef.current) {
            setState({
              data: null,
              error,
              isLoading: false,
              isSuccess: false,
              isError: true,
              isNetworkError: error instanceof TypeError && error.message.includes("Failed to fetch"),
              isRateLimited:
                error.status === 429 || error.message?.includes("429") || error.message?.includes("rate limit"),
              isCached: false,
              retryCount: state.retryCount + 1,
            })
          }
        }
      },
      [enabled, queryFn, executeQuery, state.retryCount, options],
    )

    // Initial fetch and refetch on dependency changes
    useEffect(() => {
      isMountedRef.current = true

      if (enabled) {
        execute(false) // Don't skip cache on initial fetch
      }

      return () => {
        isMountedRef.current = false
      }
    }, [enabled, execute])

    // Set up refetch interval if specified
    useEffect(() => {
      if (refetchInterval && enabled) {
        refetchIntervalRef.current = setInterval(() => {
          execute(false) // Don't skip cache on interval refetch
        }, refetchInterval)
      }

      return () => {
        if (refetchIntervalRef.current) {
          clearInterval(refetchIntervalRef.current)
        }
      }
    }, [refetchInterval, enabled, execute])

    // Set up window focus refetch
    useEffect(() => {
      if (!refetchOnWindowFocus || !enabled) return

      const handleFocus = () => {
        execute(false) // Don't skip cache on focus refetch
      }

      window.addEventListener("focus", handleFocus)

      return () => {
        window.removeEventListener("focus", handleFocus)
      }
    }, [refetchOnWindowFocus, enabled, execute])

    return {
      ...state,
      refetch: () => execute(true), // Skip cache when manually refetching
      connectionHealth,
    }
  }

  // Hook for executing a mutation
  const useMutation = <T, V = any>(
    mutationFn: (
      supabase: ReturnType<typeof getSupabaseClient>,
      variables: V,
    ) => Promise<{ data: T | null; error: any }>,
    options: QueryOptions = {},
  ) => {
    const [state, setState] = useState<QueryState<T> & { isIdle: boolean }>({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      isNetworkError: false,
      isRateLimited: false,
      isCached: false,
      isIdle: true,
      retryCount: 0,
    })

    const mutate = useCallback(
      async (variables: V) => {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          isIdle: false,
          isSuccess: false,
          isError: false,
          isNetworkError: false,
          isRateLimited: false,
        }))

        try {
          const result = await executeQuery<T>((supabase) => mutationFn(supabase, variables), {
            ...options,
            skipCache: true, // Always skip cache for mutations
            onNetworkError: () => {
              setState((prev) => ({ ...prev, isNetworkError: true }))
              options.onNetworkError?.()
            },
            onRateLimit: () => {
              setState((prev) => ({ ...prev, isRateLimited: true }))
              options.onRateLimit?.()
            },
          })

          if (result.error) {
            setState({
              data: null,
              error: result.error,
              isLoading: false,
              isSuccess: false,
              isError: true,
              isNetworkError: result.error instanceof TypeError && result.error.message.includes("Failed to fetch"),
              isRateLimited:
                result.error.status === 429 ||
                result.error.message?.includes("429") ||
                result.error.message?.includes("rate limit"),
              isCached: false,
              isIdle: false,
              retryCount: state.retryCount,
            })
            return { data: null, error: result.error }
          } else {
            setState({
              data: result.data,
              error: null,
              isLoading: false,
              isSuccess: true,
              isError: false,
              isNetworkError: false,
              isRateLimited: false,
              isCached: false,
              isIdle: false,
              retryCount: 0,
            })
            return { data: result.data, error: null }
          }
        } catch (error: any) {
          setState({
            data: null,
            error,
            isLoading: false,
            isSuccess: false,
            isError: true,
            isNetworkError: error instanceof TypeError && error.message.includes("Failed to fetch"),
            isRateLimited:
              error.status === 429 || error.message?.includes("429") || error.message?.includes("rate limit"),
            isCached: false,
            isIdle: false,
            retryCount: state.retryCount + 1,
          })
          return { data: null, error }
        }
      },
      [executeQuery, options, state.retryCount],
    )

    const reset = useCallback(() => {
      setState({
        data: null,
        error: null,
        isLoading: false,
        isSuccess: false,
        isError: false,
        isNetworkError: false,
        isRateLimited: false,
        isCached: false,
        isIdle: true,
        retryCount: 0,
      })
    }, [])

    return {
      ...state,
      mutate,
      reset,
      connectionHealth,
    }
  }

  // Force a connection check
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const isConnected = await checkSupabaseConnection()
    setConnectionHealth(getConnectionHealth())
    return isConnected
  }, [])

  // Reset the client
  const resetClient = useCallback(() => {
    resetSupabaseClient()
    setConnectionHealth(getConnectionHealth())
  }, [])

  return {
    // Core functions
    executeQuery,

    // Hooks
    useQuery,
    useMutation,

    // Connection management
    connectionHealth,
    checkConnection,
    resetClient,

    // Debug utilities
    setDebug,

    // Batch status
    batchStatus,
    queueLength,
  }
}

// Export a default instance for convenience
export default useSupabase

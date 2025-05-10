"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { checkSupabaseConnection, getConnectionHealth, resetSupabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@/context/auth-context"
import { useBatchedSupabase } from "@/hooks/use-batched-supabase"
import { getSupabaseClient } from "@/utils/supabase-client"

type QueryOptions = {
  retry?: boolean
  maxRetries?: number
  timeout?: number
  batchable?: boolean
  priority?: "high" | "medium" | "low"
  category?: string
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onNetworkError?: () => void
  onRateLimit?: () => void
}

type QueryState<T> = {
  data: T | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isNetworkError: boolean
  isRateLimited: boolean
  retryCount: number
}

export function useOptimizedSupabase() {
  const { user } = useAuth()
  const { executeBatched, batcherStatus } = useBatchedSupabase()
  const [connectionHealth, setConnectionHealth] = useState(getConnectionHealth())
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Execute a Supabase query with optimized parameters
  const executeQuery = useCallback(
    async <T,>(
      queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ data: T | null; error: any }>,
      options: QueryOptions = {},
    ): Promise<{ data: T | null; error: any }> => {
      const {
        retry = true,
        maxRetries = 3,
        timeout = 10000,
        batchable = false,
        priority = "medium",
        category = "database",
        onSuccess,
        onError,
        onNetworkError,
        onRateLimit,
      } = options

      // If we should use the batcher and it's available
      if (batchable && executeBatched) {
        return executeBatched(
          async () => {
            try {
              const supabase = getSupabaseClient()
              const result = await queryFn(supabase)

              if (result.error) {
                throw result.error
              }

              if (onSuccess && result.data) {
                onSuccess(result.data)
              }

              return result
            } catch (error: any) {
              // Handle rate limiting
              if (error.status === 429 || error.message?.includes("429") || error.message?.includes("rate limit")) {
                console.warn("Rate limit detected in optimized query")
                onRateLimit?.()
                throw error
              }

              // Handle network errors
              if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                console.error("Network error in optimized query:", error)
                onNetworkError?.()
                throw error
              }

              // Handle other errors
              console.error("Error in optimized query:", error)
              onError?.(error)
              throw error
            }
          },
          { priority, category, retryOnNetworkError: retry, maxRetries },
        )
      }

      // Otherwise, execute directly with our own retry logic
      let retryCount = 0

      while (true) {
        try {
          // Get a client with the specified timeout
          const supabase = getSupabaseClient()
          const result = await queryFn(supabase)

          if (result.error) {
            // Handle rate limiting
            if (
              result.error.status === 429 ||
              result.error.message?.includes("429") ||
              result.error.message?.includes("rate limit")
            ) {
              console.warn("Rate limit detected in optimized query")
              onRateLimit?.()

              if (retry && retryCount < maxRetries) {
                // Calculate backoff time - exponential with jitter
                const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
                console.log(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

                // Wait for the backoff period
                await new Promise((resolve) => setTimeout(resolve, backoffTime))

                retryCount++
                continue
              }
            }

            onError?.(result.error)
            return result
          }

          if (onSuccess && result.data) {
            onSuccess(result.data)
          }

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
            console.log(`Network error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

            // Wait for the backoff period
            await new Promise((resolve) => setTimeout(resolve, backoffTime))

            retryCount++
            continue
          }

          // Handle other errors
          console.error("Error in optimized query:", error)
          onError?.(error)

          return { data: null, error }
        }
      }
    },
    [executeBatched],
  )

  // Hook for executing a query with state management
  const useQuery = <T,>(
    queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ data: T | null; error: any }>,
    options: QueryOptions & {
      enabled?: boolean
      refetchInterval?: number
      refetchOnWindowFocus?: boolean
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
      retryCount: 0,
    })

    const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef(true)

    const execute = useCallback(async () => {
      if (!enabled) return

      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const result = await executeQuery<T>(queryFn, {
          ...queryOptions,
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
            retryCount: state.retryCount + 1,
          })
        }
      }
    }, [enabled, queryFn, executeQuery, state.retryCount])

    // Initial fetch and refetch on dependency changes
    useEffect(() => {
      isMountedRef.current = true

      if (enabled) {
        execute()
      }

      return () => {
        isMountedRef.current = false
      }
    }, [enabled, execute])

    // Set up refetch interval if specified
    useEffect(() => {
      if (refetchInterval && enabled) {
        refetchIntervalRef.current = setInterval(() => {
          execute()
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
        execute()
      }

      window.addEventListener("focus", handleFocus)

      return () => {
        window.removeEventListener("focus", handleFocus)
      }
    }, [refetchOnWindowFocus, enabled, execute])

    return {
      ...state,
      refetch: execute,
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
            isIdle: false,
            retryCount: state.retryCount + 1,
          })
          return { data: null, error }
        }
      },
      [executeQuery, options, state.retryCount, mutationFn],
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
    executeQuery,
    useQuery,
    useMutation,
    connectionHealth,
    checkConnection,
    resetClient,
  }
}

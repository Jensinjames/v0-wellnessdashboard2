"use client"

/**
 * Custom hook for cached Supabase queries
 * Provides automatic caching, revalidation, and error handling
 */
import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseClient } from "@/utils/supabase-client"
import { getEnhancedQueryCache } from "@/lib/enhanced-query-cache"
import { safeDevLog } from "@/utils/safe-console"

type QueryOptions<T> = {
  // Cache options
  cacheTime?: number // How long to cache the result (ms)
  staleTime?: number // How long until data is considered stale (ms)
  cacheKey?: string // Custom cache key (generated from table and params if not provided)
  cacheTags?: string[] // Tags for cache invalidation

  // Fetch options
  enabled?: boolean // Whether to automatically fetch
  refetchOnMount?: boolean // Whether to refetch when component mounts
  refetchOnWindowFocus?: boolean // Whether to refetch when window regains focus
  refetchOnReconnect?: boolean // Whether to refetch when network reconnects
  refetchInterval?: number | false // Polling interval (ms), false to disable

  // Error handling
  retry?: boolean // Whether to retry failed queries
  retryCount?: number // Number of retry attempts
  retryDelay?: number | ((attempt: number) => number) // Delay between retries

  // Callbacks
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onSettled?: (data: T | null, error: Error | null) => void

  // Optimistic updates
  optimisticData?: T // Data to use while fetching
}

type QueryResult<T> = {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isFetching: boolean
  isStale: boolean
  refetch: () => Promise<void>
  invalidate: () => void
  setData: (data: T | ((prev: T | null) => T)) => void
}

/**
 * Hook for cached Supabase queries
 * @param table Table name
 * @param params Query parameters
 * @param options Query options
 * @returns Query result
 */
export function useCachedSupabaseQuery<T = any>(
  table: string,
  params: {
    columns?: string
    filter?: Record<string, any>
    limit?: number
    order?: { column: string; ascending: boolean }
    single?: boolean
  },
  options: QueryOptions<T> = {},
): QueryResult<T> {
  const supabase = getSupabaseClient()
  const cache = getEnhancedQueryCache()

  // Default options
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    cacheKey = `${table}:${JSON.stringify(params)}`,
    cacheTags = [table],
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    refetchInterval = false,
    retry = true,
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    onSettled,
    optimisticData = null,
  } = options

  // State
  const [data, setData] = useState<T | null>(optimisticData)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [isFetching, setIsFetching] = useState<boolean>(enabled)
  const [isStale, setIsStale] = useState<boolean>(false)

  // Refs
  const retryCountRef = useRef(0)
  const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const paramsRef = useRef(params)
  const fetchingPromiseRef = useRef<Promise<void> | null>(null)

  // Update params ref when params change
  useEffect(() => {
    paramsRef.current = params
  }, [params])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current)
      }
    }
  }, [])

  // Setup refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (isMountedRef.current) {
        fetchData(true)
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [refetchOnWindowFocus])

  // Setup refetch on network reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return

    const handleOnline = () => {
      if (isMountedRef.current) {
        fetchData(true)
      }
    }

    window.addEventListener("online", handleOnline)
    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [refetchOnReconnect])

  // Setup refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    refetchIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchData(true)
      }
    }, refetchInterval)

    return () => {
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current)
      }
    }
  }, [refetchInterval, enabled])

  // Fetch data function
  const fetchData = useCallback(
    async (skipCache = false): Promise<void> => {
      // If there's already a fetching promise, return it
      if (fetchingPromiseRef.current) {
        return fetchingPromiseRef.current
      }

      // Create a new fetching promise
      const fetchPromise = (async () => {
        if (!enabled) return

        setIsFetching(true)

        // Check cache first if not skipping
        if (!skipCache) {
          const { data: cachedData, isStale: isCachedDataStale } = cache.get<T>(cacheKey, {
            allowStale: true,
            revalidate: isCachedDataStale,
            revalidateCallback: (newData) => {
              if (isMountedRef.current) {
                setData(newData)
                setIsStale(false)
                if (onSuccess) onSuccess(newData)
                if (onSettled) onSettled(newData, null)
              }
            },
          })

          if (cachedData) {
            setData(cachedData)
            setError(null)
            setIsLoading(false)
            setIsStale(isCachedDataStale)

            // If data is fresh, we're done
            if (!isCachedDataStale) {
              setIsFetching(false)
              if (onSuccess) onSuccess(cachedData)
              if (onSettled) onSettled(cachedData, null)
              return
            }

            // Otherwise, continue to fetch fresh data but don't block UI
          }
        }

        try {
          // Build the query
          let query = supabase.from(table).select(params.columns || "*")

          // Apply filters
          if (params.filter) {
            Object.entries(params.filter).forEach(([key, value]) => {
              if (value === null) {
                query = query.is(key, null)
              } else if (Array.isArray(value)) {
                query = query.in(key, value)
              } else if (typeof value === "object") {
                // Handle range queries, etc.
                if ("gt" in value) query = query.gt(key, value.gt)
                if ("gte" in value) query = query.gte(key, value.gte)
                if ("lt" in value) query = query.lt(key, value.lt)
                if ("lte" in value) query = query.lte(key, value.lte)
                if ("neq" in value) query = query.neq(key, value.neq)
              } else {
                query = query.eq(key, value)
              }
            })
          }

          // Apply limit
          if (params.limit) {
            query = query.limit(params.limit)
          }

          // Apply order
          if (params.order) {
            query = query.order(params.order.column, { ascending: params.order.ascending })
          }

          // Get single item if requested
          if (params.single) {
            query = query.single()
          }

          // Execute the query
          const { data: freshData, error: queryError } = await query

          if (queryError) {
            throw new Error(`Supabase error: ${queryError.message}`)
          }

          // Update cache
          cache.set(cacheKey, freshData, {
            ttl: cacheTime,
            tags: cacheTags,
            queryParams: params,
          })

          // Update state if component is still mounted
          if (isMountedRef.current) {
            setData(freshData as T)
            setError(null)
            setIsLoading(false)
            setIsFetching(false)
            setIsStale(false)
            retryCountRef.current = 0

            if (onSuccess) onSuccess(freshData as T)
            if (onSettled) onSettled(freshData as T, null)
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))

          // Handle retry logic
          if (retry && retryCountRef.current < retryCount) {
            retryCountRef.current++

            const delay =
              typeof retryDelay === "function"
                ? retryDelay(retryCountRef.current)
                : retryDelay * Math.pow(2, retryCountRef.current - 1) // Exponential backoff

            safeDevLog(`Retrying query (${retryCountRef.current}/${retryCount}) after ${delay}ms`)

            await new Promise((resolve) => setTimeout(resolve, delay))

            if (isMountedRef.current) {
              fetchingPromiseRef.current = null
              return fetchData(skipCache)
            }
            return
          }

          // Update state if component is still mounted
          if (isMountedRef.current) {
            setError(error)
            setIsLoading(false)
            setIsFetching(false)

            if (onError) onError(error)
            if (onSettled) onSettled(null, error)
          }
        }
      })()

      // Store the promise and clear it when done
      fetchingPromiseRef.current = fetchPromise
      fetchPromise.finally(() => {
        fetchingPromiseRef.current = null
      })

      return fetchPromise
    },
    [
      table,
      // We don't include params in the dependency array because we use paramsRef
      enabled,
      cacheKey,
      cacheTags,
      cacheTime,
      retry,
      retryCount,
      retryDelay,
      onSuccess,
      onError,
      onSettled,
    ],
  )

  // Initial fetch
  useEffect(() => {
    if (enabled && (refetchOnMount || !data)) {
      fetchData()
    }
  }, [enabled, refetchOnMount, fetchData])

  // Manual refetch function
  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  // Manual invalidate function
  const invalidate = useCallback(() => {
    cache.delete(cacheKey)
    setIsStale(true)
  }, [cacheKey])

  // Manual setData function with functional updates
  const setDataValue = useCallback(
    (value: T | ((prev: T | null) => T)) => {
      setData((prev) => {
        const newData = typeof value === "function" ? (value as (prev: T | null) => T)(prev) : value

        // Update cache with new data
        cache.set(cacheKey, newData, {
          ttl: cacheTime,
          tags: cacheTags,
          queryParams: paramsRef.current,
        })

        return newData
      })
    },
    [cacheKey, cacheTags, cacheTime],
  )

  return {
    data,
    error,
    isLoading,
    isError: !!error,
    isSuccess: !!data && !error,
    isFetching,
    isStale,
    refetch,
    invalidate,
    setData: setDataValue,
  }
}

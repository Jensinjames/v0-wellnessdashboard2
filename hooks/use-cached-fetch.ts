"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import { setCacheItem, getCacheItem, CACHE_EXPIRY } from "@/lib/cache-utils"

interface UseCachedFetchOptions<T> {
  cacheKey: string
  fetchFn: () => Promise<T>
  initialData?: T
  cacheExpiry?: number
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useCachedFetch<T>({
  cacheKey,
  fetchFn,
  initialData,
  cacheExpiry = CACHE_EXPIRY.MEDIUM,
  enabled = true,
  onSuccess,
  onError,
}: UseCachedFetchOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  const fetchData = useCallback(
    async (skipCache = false) => {
      if (!enabled) return

      setIsLoading(true)
      setError(null)

      try {
        // Check cache first if not skipping cache
        if (!skipCache) {
          const cachedData = getCacheItem<T>(cacheKey)
          if (cachedData) {
            setData(cachedData)
            setIsLoading(false)
            onSuccess?.(cachedData)
            return
          }
        }

        // Fetch fresh data
        const freshData = await fetchFn()

        // Update state and cache
        setData(freshData)
        setCacheItem(cacheKey, freshData, cacheExpiry)
        onSuccess?.(freshData)
      } catch (err) {
        console.error(`Error fetching data for ${cacheKey}:`, err)
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        onError?.(errorObj)
      } finally {
        setIsLoading(false)
      }
    },
    [cacheKey, fetchFn, cacheExpiry, enabled, onSuccess, onError],
  )

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true), // Skip cache when manually refetching
    mutate: (newData: T) => {
      setData(newData)
      setCacheItem(cacheKey, newData, cacheExpiry)
    },
  }
}

// Helper hook for Supabase queries with caching
export function useCachedSupabaseQuery<T>({
  cacheKey,
  queryFn,
  cacheExpiry = CACHE_EXPIRY.MEDIUM,
  enabled = true,
  onSuccess,
  onError,
}: {
  cacheKey: string
  queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ data: T | null; error: any }>
  cacheExpiry?: number
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}) {
  const fetchFn = useCallback(async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await queryFn(supabase)

    if (error) {
      throw error
    }

    return data as T
  }, [queryFn])

  return useCachedFetch<T>({
    cacheKey,
    fetchFn,
    cacheExpiry,
    enabled,
    onSuccess,
    onError,
  })
}

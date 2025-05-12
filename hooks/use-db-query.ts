"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { handleDbError, type DbError } from "@/lib/db/db-utils"

interface UseDbQueryResult<T> {
  data: T | null
  error: DbError | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

/**
 * Hook for client-side data fetching with error handling
 */
export function useDbQuery<T>(
  queryFn: (supabase: ReturnType<typeof createBrowserClient>) => Promise<{ data: T | null; error: any }>,
  dependencies: any[] = [],
  options?: {
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: DbError) => void
  },
): UseDbQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<DbError | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const enabled = options?.enabled !== false

  const fetchData = async () => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()
      const { data, error: queryError } = await queryFn(supabase)

      if (queryError) {
        const formattedError = handleDbError(queryError, "useDbQuery")
        setError(formattedError)
        options?.onError?.(formattedError)
      } else if (data) {
        setData(data)
        options?.onSuccess?.(data)
      }
    } catch (err) {
      const formattedError = handleDbError(err, "useDbQuery")
      setError(formattedError)
      options?.onError?.(formattedError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetchData,
  }
}

/**
 * Hook for client-side data mutation with error handling
 */
export function useDbMutation<TData, TVariables>(
  mutationFn: (
    supabase: ReturnType<typeof createBrowserClient>,
    variables: TVariables,
  ) => Promise<{ data: TData | null; error: any }>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: DbError) => void
  },
) {
  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<DbError | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const mutate = async (variables: TVariables) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()
      const { data, error: mutationError } = await mutationFn(supabase, variables)

      if (mutationError) {
        const formattedError = handleDbError(mutationError, "useDbMutation")
        setError(formattedError)
        options?.onError?.(formattedError)
        return { success: false, error: formattedError }
      } else if (data) {
        setData(data)
        options?.onSuccess?.(data)
        return { success: true, data }
      }

      return { success: false, error: null }
    } catch (err) {
      const formattedError = handleDbError(err, "useDbMutation")
      setError(formattedError)
      options?.onError?.(formattedError)
      return { success: false, error: formattedError }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mutate,
    data,
    error,
    isLoading,
    isError: error !== null,
    reset: () => {
      setData(null)
      setError(null)
    },
  }
}

"use client"

import { useState, useCallback } from "react"
import { createEdgeFunctionCaller } from "@/lib/edge-functions"
import type { EdgeFunctionResponse } from "@/types/supabase"

interface UseEdgeFunctionOptions {
  onSuccess?: (data: any) => void
  onError?: (error: { message: string; status?: number }) => void
}

/**
 * Hook for calling Supabase Edge Functions with loading and error states
 * @param functionName The name of the edge function to call
 * @param options Optional callbacks for success and error
 * @returns Object with function caller, loading state, and error state
 */
export function useEdgeFunction<T = any, P = any>(functionName: string, options: UseEdgeFunctionOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [data, setData] = useState<T | null>(null)

  const caller = createEdgeFunctionCaller<T, P>(functionName)

  const execute = useCallback(
    async (
      params?: P,
      requestOptions?: {
        headers?: HeadersInit
        method?: "GET" | "POST" | "PUT" | "DELETE"
      },
    ): Promise<EdgeFunctionResponse<T>> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await caller(params, requestOptions)

        if (response.error) {
          setError(response.error)
          options.onError?.(response.error)
        } else {
          setData(response.data)
          options.onSuccess?.(response.data)
        }

        return response
      } catch (err) {
        const errorObj = {
          message: err instanceof Error ? err.message : "An unknown error occurred",
          status: 500,
        }
        setError(errorObj)
        options.onError?.(errorObj)

        return {
          data: null,
          error: errorObj,
        }
      } finally {
        setIsLoading(false)
      }
    },
    [caller, options],
  )

  return {
    execute,
    isLoading,
    error,
    data,
    reset: useCallback(() => {
      setData(null)
      setError(null)
    }, []),
  }
}

"use client"

import { useState, useCallback } from "react"
import { executeOptimisticAction, type OptimisticActionOptions } from "@/lib/optimistic-action"

type OptimisticActionState = {
  isLoading: boolean
  isError: boolean
  error: Error | null
  optimisticId: string | null
}

type UseOptimisticActionOptions<T, R> = Omit<
  OptimisticActionOptions<T, R>,
  "data" | "onSuccess" | "onError" | "onSettled"
>

/**
 * Hook for executing server actions with optimistic UI updates
 */
export function useOptimisticAction<T, R>(options: UseOptimisticActionOptions<T, R>) {
  const [state, setState] = useState<OptimisticActionState>({
    isLoading: false,
    isError: false,
    error: null,
    optimisticId: null,
  })

  const execute = useCallback(
    async (data: T) => {
      setState({
        isLoading: true,
        isError: false,
        error: null,
        optimisticId: null,
      })

      const result = await executeOptimisticAction({
        ...options,
        data,
        onSuccess: (result, optimisticId) => {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            optimisticId,
          }))

          if (options.onSuccess) {
            options.onSuccess(result, optimisticId)
          }
        },
        onError: (error, optimisticId) => {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isError: true,
            error,
            optimisticId,
          }))

          if (options.onError) {
            options.onError(error, optimisticId)
          }
        },
        onSettled: (optimisticId) => {
          if (options.onSettled) {
            options.onSettled(optimisticId)
          }
        },
      })

      return result
    },
    [options],
  )

  return {
    execute,
    ...state,
  }
}

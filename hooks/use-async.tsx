"use client"

import { useState, useCallback } from "react"
import { useLoading } from "@/context/loading-context"
import { reportError, type ErrorType } from "@/lib/error-reporting"

interface UseAsyncOptions {
  loadingKey?: string
  errorType?: ErrorType
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface AsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

export function useAsync<T = any>(options: UseAsyncOptions = {}) {
  const { loadingKey = "global", errorType = "async_error", onSuccess, onError } = options

  const { startLoading, stopLoading } = useLoading()
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  })

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>) => {
      try {
        setState({
          data: null,
          error: null,
          isLoading: true,
          isSuccess: false,
          isError: false,
        })
        startLoading(loadingKey)

        const data = await asyncFunction()

        setState({
          data,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        })

        if (onSuccess) {
          onSuccess(data)
        }

        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        setState({
          data: null,
          error: err,
          isLoading: false,
          isSuccess: false,
          isError: true,
        })

        reportError(errorType, err)

        if (onError) {
          onError(err)
        }

        throw err
      } finally {
        stopLoading(loadingKey)
      }
    },
    [loadingKey, errorType, onSuccess, onError, startLoading, stopLoading],
  )

  return {
    ...state,
    execute,
  }
}

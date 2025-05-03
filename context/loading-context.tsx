"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { LoadingOverlay } from "@/components/ui/loading/loading-overlay"
import { reportError } from "@/lib/error-reporting"

interface LoadingState {
  [key: string]: boolean
}

type ErrorType = "async_error" | "critical_error"

interface LoadingContextType {
  isLoading: (key?: string) => boolean
  startLoading: (key: string) => void
  stopLoading: (key: string) => void
  withLoading: <T>(
    key: string,
    promise: Promise<T>,
    options?: {
      timeout?: number
      retries?: number
      retryDelay?: number
      errorType?: ErrorType
      errorContext?: Record<string, any>
    },
  ) => Promise<[T | null, Error | null]>
  loadingState: LoadingState
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({})

  const isLoading = useCallback(
    (key?: string) => {
      if (key) {
        return !!loadingState[key]
      }
      // If no key is provided, check if any loading state is active
      return Object.values(loadingState).some(Boolean)
    },
    [loadingState],
  )

  const startLoading = useCallback((key: string) => {
    setLoadingState((prev) => ({ ...prev, [key]: true }))
  }, [])

  const stopLoading = useCallback((key: string) => {
    setLoadingState((prev) => ({ ...prev, [key]: false }))
  }, [])

  // Utility to wrap async operations with loading state
  const withLoading = useCallback(
    async <T,>(
      key: string,
      promise: Promise<T>,
      options?: {
        timeout?: number
        retries?: number
        retryDelay?: number
        errorType?: ErrorType
        errorContext?: Record<string, any>
      },
    ): Promise<[T | null, Error | null]> => {
      const {
        timeout = 30000, // 30 seconds default timeout
        retries = 0,
        retryDelay = 1000,
        errorType = "async_error",
        errorContext = {},
      } = options || {}

      let attempt = 0
      let timeoutId: NodeJS.Timeout | null = null

      const executeWithTimeout = (): Promise<T> => {
        return new Promise((resolve, reject) => {
          // Set timeout to cancel the operation if it takes too long
          timeoutId = setTimeout(() => {
            const timeoutError = new Error(`Operation timed out after ${timeout}ms`)
            reject(timeoutError)
          }, timeout)

          // Execute the actual promise
          promise.then(
            (result) => {
              if (timeoutId) clearTimeout(timeoutId)
              resolve(result)
            },
            (error) => {
              if (timeoutId) clearTimeout(timeoutId)
              reject(error)
            },
          )
        })
      }

      try {
        startLoading(key)

        // Implement retry logic
        while (true) {
          try {
            const result = await executeWithTimeout()
            return [result, null]
          } catch (error) {
            attempt++

            // Determine if we should retry
            if (attempt <= retries) {
              console.log(`Attempt ${attempt}/${retries} failed, retrying in ${retryDelay}ms...`)
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
              continue
            }

            // No more retries, report and throw the error
            const enhancedError = error instanceof Error ? error : new Error(String(error))

            // Add additional context to the error
            const enhancedContext = {
              ...errorContext,
              loadingKey: key,
              attempts: attempt,
              timestamp: new Date().toISOString(),
              url: typeof window !== "undefined" ? window.location.href : "",
            }

            // Report the error with enhanced context
            reportError(errorType, enhancedError, undefined, errorType === "critical_error")

            // Log additional debugging information in development
            if (process.env.NODE_ENV === "development") {
              console.group("Loading Error Details")
              console.error("Error:", enhancedError)
              console.error("Context:", enhancedContext)
              console.groupEnd()
            }

            return [null, enhancedError]
          }
        }
      } finally {
        stopLoading(key)
      }
    },
    [startLoading, stopLoading],
  )

  const value = {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    loadingState,
  }

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}

// HOC to wrap components with loading state
export function withLoadingState<P extends object>(Component: React.ComponentType<P>, loadingKey: string) {
  return function WithLoadingState(props: P) {
    const { isLoading } = useLoading()
    const loading = isLoading(loadingKey)

    return (
      <LoadingOverlay isLoading={loading}>
        <Component {...props} />
      </LoadingOverlay>
    )
  }
}

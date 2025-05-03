"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { LoadingOverlay } from "@/components/ui/loading/loading-overlay"
import { reportError } from "@/lib/error-reporting"

interface LoadingState {
  [key: string]: boolean
}

interface LoadingContextType {
  isLoading: (key?: string) => boolean
  startLoading: (key: string) => void
  stopLoading: (key: string) => void
  withLoading: <T>(key: string, promise: Promise<T>) => Promise<T>
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
    async <T,>(key: string, promise: Promise<T>): Promise<T> => {
      try {
        startLoading(key)
        const result = await promise
        return result
      } catch (error) {
        reportError("async_error", error instanceof Error ? error : new Error(String(error)))
        throw error
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

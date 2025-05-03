"use client"

import { useState, useCallback } from "react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryAPI {
  showBoundary: (error: Error) => void
  resetBoundary: () => void
}

/**
 * A hook that provides error boundary functionality in function components.
 */
export function useErrorBoundary(): [ErrorBoundaryState, ErrorBoundaryAPI] {
  const [state, setState] = useState<ErrorBoundaryState>({ hasError: false, error: null })

  const showBoundary = useCallback((error: Error) => {
    setState({ hasError: true, error })
  }, [])

  const resetBoundary = useCallback(() => {
    setState({ hasError: false, error: null })
  }, [])

  return [state, { showBoundary, resetBoundary }]
}

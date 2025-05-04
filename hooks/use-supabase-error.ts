"use client"

import { useState, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"

interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
}

/**
 * Hook for consistent Supabase error handling
 */
export function useSupabaseError(defaultOptions: ErrorHandlerOptions = { showToast: true, logToConsole: true }) {
  const [lastError, setLastError] = useState<Error | null>(null)

  const handleError = useCallback(
    (error: any, message = "An error occurred", options?: ErrorHandlerOptions) => {
      const opts = { ...defaultOptions, ...options }
      const errorObj = error instanceof Error ? error : new Error(String(error))

      setLastError(errorObj)

      if (opts.logToConsole) {
        console.error(`${message}:`, error)
      }

      if (opts.showToast) {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
      }

      return errorObj
    },
    [defaultOptions],
  )

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  return {
    error: lastError,
    handleError,
    clearError,
  }
}

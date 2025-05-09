"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  structureSupabaseError,
  getUserFriendlyErrorMessage,
  logSupabaseError,
  isSupabaseError,
  SupabaseErrorType,
  ErrorSeverity,
} from "@/utils/supabase-error-utils"
import { useAuth } from "@/context/auth-context"

interface ErrorState {
  hasError: boolean
  message: string | null
  type: SupabaseErrorType | null
  severity: ErrorSeverity | null
  timestamp: Date | null
  recoverable: boolean
}

interface UseSupabaseErrorHandlerOptions {
  context?: string
  showToast?: boolean
  logErrors?: boolean
  autoRefreshTokenOnAuthError?: boolean
}

export function useSupabaseErrorHandler(options: UseSupabaseErrorHandlerOptions = {}) {
  const { context = "unknown", showToast = true, logErrors = true, autoRefreshTokenOnAuthError = true } = options

  const { toast } = useToast()
  const { refreshToken } = useAuth()
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: null,
    type: null,
    severity: null,
    timestamp: null,
    recoverable: false,
  })
  const [isRecovering, setIsRecovering] = useState(false)

  const handleError = useCallback(
    async (error: any) => {
      // Check if it's a Supabase error
      if (!isSupabaseError(error)) {
        setErrorState({
          hasError: true,
          message: error.message || "An unexpected error occurred",
          type: null,
          severity: ErrorSeverity.MEDIUM,
          timestamp: new Date(),
          recoverable: false,
        })

        if (showToast) {
          toast({
            title: "Error",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
          })
        }

        if (logErrors) {
          console.error(`[Error] [${context}]:`, error)
        }

        return
      }

      // Structure the error
      const structuredError = structureSupabaseError(error)

      // Set error state
      setErrorState({
        hasError: true,
        message: getUserFriendlyErrorMessage(error),
        type: structuredError.type,
        severity: structuredError.severity,
        timestamp: structuredError.timestamp,
        recoverable: structuredError.recoverable,
      })

      // Show toast if enabled
      if (showToast) {
        toast({
          title: `${structuredError.type.charAt(0).toUpperCase() + structuredError.type.slice(1)} Error`,
          description: getUserFriendlyErrorMessage(error),
          variant: "destructive",
        })
      }

      // Log error if enabled
      if (logErrors) {
        logSupabaseError(error, context)
      }

      // Auto-refresh token for auth errors if enabled
      if (
        autoRefreshTokenOnAuthError &&
        structuredError.type === SupabaseErrorType.AUTH &&
        structuredError.recoverable &&
        structuredError.message.includes("token")
      ) {
        try {
          setIsRecovering(true)
          await refreshToken()
          setIsRecovering(false)

          // Clear error state if token refresh was successful
          setErrorState({
            hasError: false,
            message: null,
            type: null,
            severity: null,
            timestamp: null,
            recoverable: false,
          })

          return true // Indicate successful recovery
        } catch (refreshError) {
          setIsRecovering(false)

          // Log refresh error
          if (logErrors) {
            console.error(`[Token Refresh Error] [${context}]:`, refreshError)
          }

          return false // Indicate failed recovery
        }
      }

      return false // No recovery attempted
    },
    [context, showToast, logErrors, autoRefreshTokenOnAuthError, toast, refreshToken],
  )

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: null,
      type: null,
      severity: null,
      timestamp: null,
      recoverable: false,
    })
  }, [])

  return {
    error: errorState,
    handleError,
    clearError,
    isRecovering,
  }
}

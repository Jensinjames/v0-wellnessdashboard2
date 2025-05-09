"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import {
  structureSupabaseError,
  logSupabaseError,
  isSupabaseError,
  SupabaseErrorType,
  ErrorSeverity,
  type StructuredError,
} from "@/utils/supabase-error-utils"

interface SupabaseErrorContextType {
  lastError: StructuredError | null
  setLastError: (error: any, context?: string) => void
  clearLastError: () => void
  isHandlingError: boolean
  errorCount: number
  errorHistory: StructuredError[]
  clearErrorHistory: () => void
}

const SupabaseErrorContext = createContext<SupabaseErrorContextType | undefined>(undefined)

export function SupabaseErrorProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const { refreshToken } = useAuth()
  const [lastError, setLastErrorState] = useState<StructuredError | null>(null)
  const [isHandlingError, setIsHandlingError] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const [errorHistory, setErrorHistory] = useState<StructuredError[]>([])

  // Handle auth errors automatically
  useEffect(() => {
    if (
      lastError &&
      lastError.type === SupabaseErrorType.AUTH &&
      lastError.recoverable &&
      lastError.message.includes("token")
    ) {
      const handleAuthError = async () => {
        setIsHandlingError(true)
        try {
          await refreshToken()
          toast({
            title: "Session Refreshed",
            description: "Your session has been refreshed successfully.",
          })
        } catch (error) {
          toast({
            title: "Session Error",
            description: "Failed to refresh your session. Please sign in again.",
            variant: "destructive",
          })
        } finally {
          setIsHandlingError(false)
        }
      }

      handleAuthError()
    }
  }, [lastError, refreshToken, toast])

  const setLastError = useCallback((error: any, context = "unknown") => {
    if (!error) return

    // Increment error count
    setErrorCount((prev) => prev + 1)

    // Structure the error if it's a Supabase error
    const structuredError = isSupabaseError(error)
      ? structureSupabaseError(error)
      : {
          type: SupabaseErrorType.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          message: error.message || "An unexpected error occurred",
          originalError: error,
          recoverable: false,
          timestamp: new Date(),
        }

    // Set as last error
    setLastErrorState(structuredError)

    // Add to history (limit to last 10 errors)
    setErrorHistory((prev) => {
      const newHistory = [structuredError, ...prev]
      return newHistory.slice(0, 10)
    })

    // Log the error
    logSupabaseError(error, context)
  }, [])

  const clearLastError = useCallback(() => {
    setLastErrorState(null)
  }, [])

  const clearErrorHistory = useCallback(() => {
    setErrorHistory([])
    setErrorCount(0)
  }, [])

  return (
    <SupabaseErrorContext.Provider
      value={{
        lastError,
        setLastError,
        clearLastError,
        isHandlingError,
        errorCount,
        errorHistory,
        clearErrorHistory,
      }}
    >
      {children}
    </SupabaseErrorContext.Provider>
  )
}

export function useSupabaseErrorContext() {
  const context = useContext(SupabaseErrorContext)
  if (context === undefined) {
    throw new Error("useSupabaseErrorContext must be used within a SupabaseErrorProvider")
  }
  return context
}

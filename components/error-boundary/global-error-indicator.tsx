"use client"

import { useState, useEffect } from "react"
import { useSupabaseErrorContext } from "@/context/supabase-error-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, AlertCircle, ShieldAlert, Database, Wifi, HardDrive } from "lucide-react"
import { SupabaseErrorType, ErrorSeverity } from "@/utils/supabase-error-utils"
import { useAuth } from "@/context/auth-context"

export function GlobalErrorIndicator() {
  const { lastError, clearLastError, isHandlingError } = useSupabaseErrorContext()
  const { refreshToken } = useAuth()
  const [visible, setVisible] = useState(false)

  // Show the indicator when there's an error
  useEffect(() => {
    if (lastError) {
      setVisible(true)
    }
  }, [lastError])

  // Don't render anything if there's no error or the indicator is hidden
  if (!lastError || !visible) {
    return null
  }

  // Get the appropriate icon based on error type
  const getIcon = () => {
    switch (lastError.type) {
      case SupabaseErrorType.AUTH:
        return <ShieldAlert className="h-4 w-4" />
      case SupabaseErrorType.DATABASE:
        return <Database className="h-4 w-4" />
      case SupabaseErrorType.NETWORK:
        return <Wifi className="h-4 w-4" />
      case SupabaseErrorType.STORAGE:
        return <HardDrive className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Get the appropriate variant based on error severity
  const getVariant = () => {
    switch (lastError.severity) {
      case ErrorSeverity.LOW:
        return "default"
      case ErrorSeverity.MEDIUM:
        return "warning"
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return "destructive"
      default:
        return "destructive"
    }
  }

  // Handle refresh token
  const handleRefreshToken = async () => {
    try {
      await refreshToken()
      clearLastError()
    } catch (error) {
      console.error("Failed to refresh token:", error)
    }
  }

  // Handle dismiss
  const handleDismiss = () => {
    setVisible(false)
    clearLastError()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={getVariant()} className="pr-12 shadow-lg">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleDismiss}>
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>

        {getIcon()}
        <AlertTitle className="capitalize">{lastError.type} Error</AlertTitle>
        <AlertDescription>
          <div className="mt-2">{lastError.message}</div>

          {lastError.type === SupabaseErrorType.AUTH && lastError.recoverable && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleRefreshToken}
              disabled={isHandlingError}
            >
              {isHandlingError ? "Refreshing..." : "Refresh Session"}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}

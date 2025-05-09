"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { ErrorBoundary } from "./error-boundary"
import {
  isSupabaseError,
  structureSupabaseError,
  getUserFriendlyErrorMessage,
  logSupabaseError,
  SupabaseErrorType,
  ErrorSeverity,
} from "@/utils/supabase-error-utils"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, RefreshCw, Wifi, ShieldAlert, Database, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface SupabaseErrorBoundaryProps {
  children: React.ReactNode
  component?: string
  fallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error) => void
  showAuthFallback?: boolean
  showDatabaseFallback?: boolean
  showNetworkFallback?: boolean
  showStorageFallback?: boolean
}

export function SupabaseErrorBoundary({
  children,
  component,
  fallbackComponent: FallbackComponent,
  onError,
  showAuthFallback = true,
  showDatabaseFallback = true,
  showNetworkFallback = true,
  showStorageFallback = true,
}: SupabaseErrorBoundaryProps) {
  const { refreshToken, signOut } = useAuth()
  const { toast } = useToast()
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<Error | null>(null)

  // Reset retry count when component changes
  useEffect(() => {
    setRetryCount(0)
    setLastError(null)
  }, [component])

  const handleError = useCallback(
    (error: Error) => {
      // Log the error
      logSupabaseError(error, component)

      // Store the last error
      setLastError(error)

      // Call the onError prop if provided
      if (onError) {
        onError(error)
      }

      // Show a toast notification for the error
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(error),
        variant: "destructive",
      })
    },
    [component, onError, toast],
  )

  const handleReset = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  // If a custom fallback component is provided, use it
  if (FallbackComponent) {
    return (
      <ErrorBoundary
        onError={handleError}
        onReset={handleReset}
        fallback={(error, reset) => <FallbackComponent error={error} reset={reset} />}
      >
        {children}
      </ErrorBoundary>
    )
  }

  // Otherwise, use our default Supabase error fallbacks
  return (
    <ErrorBoundary
      onError={handleError}
      onReset={handleReset}
      fallback={(error, reset) => {
        // Check if it's a Supabase error
        if (!isSupabaseError(error)) {
          return <GenericErrorFallback error={error} reset={reset} retryCount={retryCount} />
        }

        // Structure the error
        const structuredError = structureSupabaseError(error)

        // Show appropriate fallback based on error type
        switch (structuredError.type) {
          case SupabaseErrorType.AUTH:
            return showAuthFallback ? (
              <AuthErrorFallback
                error={error}
                reset={reset}
                retryCount={retryCount}
                refreshToken={refreshToken}
                signOut={signOut}
                severity={structuredError.severity}
              />
            ) : (
              <GenericErrorFallback error={error} reset={reset} retryCount={retryCount} />
            )

          case SupabaseErrorType.DATABASE:
            return showDatabaseFallback ? (
              <DatabaseErrorFallback
                error={error}
                reset={reset}
                retryCount={retryCount}
                severity={structuredError.severity}
              />
            ) : (
              <GenericErrorFallback error={error} reset={reset} retryCount={retryCount} />
            )

          case SupabaseErrorType.NETWORK:
            return showNetworkFallback ? (
              <NetworkErrorFallback error={error} reset={reset} retryCount={retryCount} />
            ) : (
              <GenericErrorFallback error={error} reset={reset} retryCount={retryCount} />
            )

          case SupabaseErrorType.STORAGE:
            return showStorageFallback ? (
              <StorageErrorFallback error={error} reset={reset} retryCount={retryCount} />
            ) : (
              <GenericErrorFallback error={error} reset={reset} retryCount={retryCount} />
            )

          default:
            return <GenericErrorFallback error={error} reset={reset} retryCount={retryCount} />
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Generic fallback for any error
function GenericErrorFallback({ error, reset, retryCount }: { error: Error; reset: () => void; retryCount: number }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span>Something went wrong</span>
        </CardTitle>
        <CardDescription>We encountered an unexpected error</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{getUserFriendlyErrorMessage(error)}</AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p>Error details: {error.message}</p>
          {retryCount > 0 && <p className="mt-2">Retry attempts: {retryCount}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardFooter>
    </Card>
  )
}

// Auth error fallback
function AuthErrorFallback({
  error,
  reset,
  retryCount,
  refreshToken,
  signOut,
  severity,
}: {
  error: Error
  reset: () => void
  retryCount: number
  refreshToken: () => Promise<boolean>
  signOut: () => Promise<void>
  severity: ErrorSeverity
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshToken = async () => {
    setIsRefreshing(true)
    try {
      await refreshToken()
      reset()
    } catch (err) {
      console.error("Failed to refresh token:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error("Failed to sign out:", err)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <span>Authentication Error</span>
        </CardTitle>
        <CardDescription>There was a problem with your authentication</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{getUserFriendlyErrorMessage(error)}</AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          {severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL ? (
            <p>You may need to sign in again to continue.</p>
          ) : (
            <p>Try refreshing your session or signing in again.</p>
          )}
          {retryCount > 0 && <p className="mt-2">Retry attempts: {retryCount}</p>}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={handleRefreshToken} disabled={isRefreshing} className="w-full">
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Session
            </>
          )}
        </Button>
        <Button onClick={handleSignOut} variant="outline" className="w-full">
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  )
}

// Database error fallback
function DatabaseErrorFallback({
  error,
  reset,
  retryCount,
  severity,
}: {
  error: Error
  reset: () => void
  retryCount: number
  severity: ErrorSeverity
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          <span>Database Error</span>
        </CardTitle>
        <CardDescription>There was a problem with the database operation</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant={severity === ErrorSeverity.LOW ? "warning" : "destructive"} className="mb-4">
          <Database className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>{getUserFriendlyErrorMessage(error)}</AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          {severity === ErrorSeverity.LOW ? (
            <p>This is likely due to invalid input data. Please check your input and try again.</p>
          ) : severity === ErrorSeverity.MEDIUM ? (
            <p>There was a problem processing your request. Please try again.</p>
          ) : (
            <p>A critical database error occurred. Please contact support if this persists.</p>
          )}
          {retryCount > 0 && <p className="mt-2">Retry attempts: {retryCount}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardFooter>
    </Card>
  )
}

// Network error fallback
function NetworkErrorFallback({
  error,
  reset,
  retryCount,
}: {
  error: Error
  reset: () => void
  retryCount: number
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-red-500" />
          <span>Network Error</span>
        </CardTitle>
        <CardDescription>There was a problem with your network connection</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning" className="mb-4">
          <Wifi className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>{getUserFriendlyErrorMessage(error)}</AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p>Please check your internet connection and try again.</p>
          {retryCount > 0 && <p className="mt-2">Retry attempts: {retryCount}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardFooter>
    </Card>
  )
}

// Storage error fallback
function StorageErrorFallback({
  error,
  reset,
  retryCount,
}: {
  error: Error
  reset: () => void
  retryCount: number
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-amber-500" />
          <span>Storage Error</span>
        </CardTitle>
        <CardDescription>There was a problem with the file operation</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning" className="mb-4">
          <HardDrive className="h-4 w-4" />
          <AlertTitle>Storage Issue</AlertTitle>
          <AlertDescription>{getUserFriendlyErrorMessage(error)}</AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p>There was a problem uploading or downloading your file. Please check the file and try again.</p>
          {retryCount > 0 && <p className="mt-2">Retry attempts: {retryCount}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardFooter>
    </Card>
  )
}

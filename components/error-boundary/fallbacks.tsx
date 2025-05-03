"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from "lucide-react"
import Link from "next/link"

interface ErrorFallbackProps {
  error?: Error | null
  resetErrorBoundary?: () => void
  message?: string
  showHome?: boolean
  showBack?: boolean
  showRefresh?: boolean
}

/**
 * A generic error fallback component that can be customized for different scenarios.
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  message = "Something went wrong",
  showHome = true,
  showBack = true,
  showRefresh = true,
}: ErrorFallbackProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-red-200">
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="flex items-center text-red-800 gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Error Encountered</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <Bug className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">{message}</h3>
          {error && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md w-full overflow-auto text-left">
              <p className="text-sm font-mono text-gray-700">{error.message}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 justify-center">
        {showRefresh && resetErrorBoundary && (
          <Button variant="outline" onClick={resetErrorBoundary} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        )}
        {showBack && (
          <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        )}
        {showHome && (
          <Button variant="default" asChild className="flex items-center gap-1">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * A fallback component specifically for data loading errors.
 */
export function DataErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      message="Failed to load data"
      showHome={false}
    />
  )
}

/**
 * A fallback component specifically for form submission errors.
 */
export function FormErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      message="Failed to submit form"
      showHome={false}
      showBack={false}
    />
  )
}

/**
 * A fallback component specifically for rendering errors.
 */
export function RenderErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      message="Failed to render component"
      showHome={false}
      showBack={false}
    />
  )
}

/**
 * A fallback component specifically for critical application errors.
 */
export function CriticalErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <ErrorFallback
      error={error}
      message="A critical error has occurred"
      showRefresh={true}
      resetErrorBoundary={() => window.location.reload()}
    />
  )
}

/**
 * A compact error fallback for inline use in smaller components.
 */
export function CompactErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="p-3 border border-red-200 bg-red-50 rounded-md text-sm">
      <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
        <AlertTriangle className="h-4 w-4" />
        <span>Error loading component</span>
      </div>
      {error && <p className="text-red-600 text-xs mb-2">{error.message}</p>}
      {resetErrorBoundary && (
        <Button variant="ghost" size="sm" onClick={resetErrorBoundary} className="text-xs h-7 px-2">
          Retry
        </Button>
      )}
    </div>
  )
}

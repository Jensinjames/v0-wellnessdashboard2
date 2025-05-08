"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

interface RedirectErrorBoundaryProps {
  children: React.ReactNode
  fallbackUrl?: string
  timeoutMs?: number
}

export function RedirectErrorBoundary({
  children,
  fallbackUrl = "/dashboard",
  timeoutMs = 5000,
}: RedirectErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Reset error state when children change
    setHasError(false)
  }, [children])

  // Error handler for React errors
  const handleError = (error: Error) => {
    console.error("Redirect error:", error)
    setHasError(true)
    return true // Prevent the error from propagating
  }

  // Handle redirect to fallback URL
  const handleRedirectToFallback = () => {
    setIsRedirecting(true)
    try {
      router.push(fallbackUrl)
    } catch (error) {
      console.error("Error redirecting to fallback:", error)
      // If even the fallback fails, try the home page
      try {
        router.push("/")
      } catch (innerError) {
        console.error("Critical redirect error:", innerError)
      }
    }
  }

  // Handle retry
  const handleRetry = () => {
    setHasError(false)
    window.location.reload()
  }

  return (
    <React.ErrorBoundary
      fallback={
        <div className="p-4 max-w-md mx-auto my-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertTitle>Navigation Error</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                There was a problem navigating to your destination. This could be due to a temporary issue or a
                misconfigured redirect.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleRetry} variant="outline" className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={handleRedirectToFallback} disabled={isRedirecting}>
                  <Home className="h-4 w-4 mr-2" />
                  {isRedirecting ? "Redirecting..." : "Go to Dashboard"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      }
      onError={handleError}
    >
      {children}
    </React.ErrorBoundary>
  )
}

"use client"

import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Auth error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message || "An unexpected error occurred during authentication"}
        </AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="default">
            <a href="/auth/sign-in">Return to Sign In</a>
          </Button>
        </div>
      </Alert>
    </div>
  )
}

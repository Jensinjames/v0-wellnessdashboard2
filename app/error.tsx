"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { reportError } from "@/lib/error-reporting"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report the error to our error reporting service
    reportError("critical_error", error, undefined, true)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="rounded-full bg-red-100 p-3 mx-auto w-fit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-red-600"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong!</h1>
        <p className="text-muted-foreground">
          We apologize for the inconvenience. The error has been reported to our team.
        </p>
        {error.digest && <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

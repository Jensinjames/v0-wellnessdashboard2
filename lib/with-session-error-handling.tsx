"use client"

import type React from "react"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { handleAuthError, handleSessionError } from "@/lib/auth-error-handler"
import { SessionErrorBoundary } from "@/components/auth/session-error-boundary"

// HOC to add session error handling to any component
export function withSessionErrorHandling<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function WithSessionErrorHandling(props: P) {
    const router = useRouter()

    // Wrap any function that might throw auth errors
    const wrapWithErrorHandling = useCallback(
      async <T extends any[], R>(fn: (...args: T) => Promise<R>, ...args: T): Promise<R | undefined> => {
        try {
          return await fn(...args)
        } catch (error) {
          const errorDetails = await handleAuthError(error)

          // Handle session error (will redirect if needed)
          const redirected = await handleSessionError(errorDetails)

          if (!redirected) {
            // Show error toast if we didn't redirect
            toast({
              title: "Error",
              description: errorDetails.message,
              variant: "destructive",
            })
          }

          return undefined
        }
      },
      [router],
    )

    return (
      <SessionErrorBoundary>
        <Component {...props} wrapWithErrorHandling={wrapWithErrorHandling} />
      </SessionErrorBoundary>
    )
  }
}

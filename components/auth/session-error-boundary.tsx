"use client"

import type React from "react"
import { Component, type ErrorInfo } from "react"
import { handleAuthError, handleSessionError } from "@/lib/auth-error-handler"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface SessionErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface SessionErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class SessionErrorBoundaryClass extends Component<
  SessionErrorBoundaryProps & {
    router: ReturnType<typeof useRouter>
    attemptSessionRefresh: () => Promise<any>
  },
  SessionErrorBoundaryState
> {
  constructor(
    props: SessionErrorBoundaryProps & {
      router: ReturnType<typeof useRouter>
      attemptSessionRefresh: () => Promise<any>
    },
  ) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Check if it's an auth error
    this.handlePossibleAuthError(error)
  }

  async handlePossibleAuthError(error: Error) {
    // Check if error message contains auth-related keywords
    const errorMessage = error.message.toLowerCase()

    if (
      errorMessage.includes("auth") ||
      errorMessage.includes("session") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("unauthenticated") ||
      errorMessage.includes("jwt")
    ) {
      const errorDetails = await handleAuthError(error)
      await handleSessionError(errorDetails)
    }
  }

  handleRetry = async () => {
    try {
      // Attempt to refresh the session
      await this.props.attemptSessionRefresh()

      // Reset error state
      this.setState({ hasError: false, error: null, errorInfo: null })
    } catch (error) {
      console.error("Failed to refresh session:", error)
      // Redirect to login as a fallback
      this.props.router.push("/login")
    }
  }

  handleLogin = () => {
    this.props.router.push("/login")
  }

  render() {
    if (this.state.hasError) {
      // Check if it's likely an auth error
      const errorMessage = this.state.error?.message.toLowerCase() || ""
      const isAuthError =
        errorMessage.includes("auth") ||
        errorMessage.includes("session") ||
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("unauthenticated") ||
        errorMessage.includes("jwt")

      // Custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-2">
            {isAuthError ? "Authentication Error" : "Something went wrong"}
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            {isAuthError
              ? "There was a problem with your authentication session."
              : "An error occurred while loading this content."}
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleRetry} variant="outline">
              Try Again
            </Button>
            {isAuthError && <Button onClick={this.handleLogin}>Sign In Again</Button>}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component to provide router and auth
export function SessionErrorBoundary({ children, fallback }: SessionErrorBoundaryProps) {
  const router = useRouter()
  const { attemptSessionRefresh } = useAuth()

  return (
    <SessionErrorBoundaryClass router={router} attemptSessionRefresh={attemptSessionRefresh} fallback={fallback}>
      {children}
    </SessionErrorBoundaryClass>
  )
}

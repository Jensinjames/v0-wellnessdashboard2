"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorState {
  hasError: boolean
  error?: Error
  info?: React.ErrorInfo
}

interface SupabaseErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class SupabaseErrorBoundary extends React.Component<SupabaseErrorBoundaryProps, ErrorState> {
  constructor(props: SupabaseErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Supabase error caught:", error, info)
    this.setState({ error, info })

    // You could send this to an error reporting service
    // reportError(error, info)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, info: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        this.props.fallback || (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                There was a problem connecting to the database. This might be due to a temporary issue or network
                connection problem.
              </p>
              <Button variant="outline" size="sm" onClick={this.resetError} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )
      )
    }

    return this.props.children
  }
}

"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="m-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-300">
              An error occurred while loading this content. We've logged the issue and will look into it.
            </p>
            {this.state.error && (
              <pre className="mt-4 max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-950/50 dark:text-red-300">
                {this.state.error.toString()}
              </pre>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}

import type { ComponentType, ReactNode } from "react"
import { ErrorBoundary } from "@/components/error-boundary/error-boundary"
import { reportError } from "./error-reporting"

interface WithErrorBoundaryOptions {
  fallback?: ReactNode
  errorType?: string
  resetOnPropsChange?: boolean
}

/**
 * Higher-order component that wraps a component with an error boundary.
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {},
) {
  const { fallback, errorType = "component_error", resetOnPropsChange = false } = options

  function WithErrorBoundary(props: P) {
    const resetKeys = resetOnPropsChange ? Object.values(props) : undefined

    return (
      <ErrorBoundary
        fallback={fallback}
        resetKeys={resetKeys}
        onError={(error, errorInfo) => reportError(errorType as any, error, errorInfo)}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || "Component"
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return WithErrorBoundary
}

import type React from "react"
import { SupabaseErrorBoundary } from "./supabase-error-boundary"

interface WithSupabaseErrorBoundaryOptions {
  component?: string
  showAuthFallback?: boolean
  showDatabaseFallback?: boolean
  showNetworkFallback?: boolean
  showStorageFallback?: boolean
  fallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error) => void
}

export function withSupabaseErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithSupabaseErrorBoundaryOptions = {},
) {
  const {
    component = Component.displayName || Component.name,
    showAuthFallback = true,
    showDatabaseFallback = true,
    showNetworkFallback = true,
    showStorageFallback = true,
    fallbackComponent,
    onError,
  } = options

  const WithErrorBoundary = (props: P) => {
    return (
      <SupabaseErrorBoundary
        component={component}
        showAuthFallback={showAuthFallback}
        showDatabaseFallback={showDatabaseFallback}
        showNetworkFallback={showNetworkFallback}
        showStorageFallback={showStorageFallback}
        fallbackComponent={fallbackComponent}
        onError={onError}
      >
        <Component {...props} />
      </SupabaseErrorBoundary>
    )
  }

  WithErrorBoundary.displayName = `WithSupabaseErrorBoundary(${component})`

  return WithErrorBoundary
}

import type React from "react"
/**
 * Error reporting utility for sending errors to a monitoring service.
 */

// Types of errors we want to track
export type ErrorType =
  | "data_fetch_error"
  | "form_error"
  | "render_error"
  | "critical_error"
  | "ui_component_error"
  | "async_error"
  | "state_error"
  | "network_error"
  | "auth_error"
  | "unknown_error"

// Error context information
interface ErrorContext {
  url: string
  timestamp: string
  userAgent: string
  componentStack?: string
  additionalInfo?: Record<string, any>
}

/**
 * Reports an error to the error monitoring service.
 * In a production app, this would send the error to a service like Sentry, LogRocket, etc.
 */
export function reportError(type: ErrorType, error: Error, errorInfo?: React.ErrorInfo, isCritical = false): void {
  // Create error context with useful debugging information
  const context: ErrorContext = {
    url: typeof window !== "undefined" ? window.location.href : "",
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    componentStack: errorInfo?.componentStack,
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.group(`%c${type.toUpperCase()}`, "color: red; font-weight: bold;")
    console.error("Error:", error)
    console.error("Context:", context)
    if (errorInfo) {
      console.error("Component Stack:", errorInfo.componentStack)
    }
    console.groupEnd()
  }

  // In production, send to error monitoring service
  if (process.env.NODE_ENV === "production") {
    // This is where you would integrate with your error reporting service
    // Example with a hypothetical error reporting service:
    /*
    ErrorReportingService.captureError({
      type,
      error,
      context,
      isCritical,
    })
    */

    // For now, just log to console in a structured way
    console.error(
      JSON.stringify({
        type,
        message: error.message,
        stack: error.stack,
        context,
        isCritical,
      }),
    )
  }

  // For critical errors, you might want to take additional actions
  if (isCritical) {
    // Example: Show a global error notification
    // notifyGlobalError(error.message)
    // Example: Log the user out if it's an auth error
    // if (type === 'auth_error') { logout() }
  }
}

/**
 * Utility function to handle async errors and report them.
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  errorType: ErrorType = "async_error",
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    reportError(errorType, err)
    return [null, err]
  }
}

/**
 * Creates a safe version of a function that catches and reports errors.
 */
export function createSafeFunction<T extends (...args: any[]) => any>(
  fn: T,
  errorType: ErrorType = "unknown_error",
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    try {
      return fn(...args)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      reportError(errorType, err)
      return undefined
    }
  }
}

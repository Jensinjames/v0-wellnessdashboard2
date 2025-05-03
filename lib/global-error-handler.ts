import { reportError } from "./error-reporting"

/**
 * Sets up global error handlers for unhandled errors and promise rejections.
 * Call this function early in your application lifecycle.
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window !== "undefined") {
    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      reportError("unknown_error", event.error || new Error(event.message), undefined, true)

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("Global error handler caught:", event)
      }
    })

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const error =
        event.reason instanceof Error ? event.reason : new Error(String(event.reason) || "Unhandled Promise Rejection")

      reportError("async_error", error, undefined, true)

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("Unhandled promise rejection:", event)
      }
    })
  }
}

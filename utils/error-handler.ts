/**
 * Error Handler
 * Centralized error handling utilities
 */

import { isClient } from "@/utils/environment"

// Error types
export enum ErrorType {
  NETWORK = "network",
  AUTH = "auth",
  DATABASE = "database",
  VALIDATION = "validation",
  SERVER = "server",
  CLIENT = "client",
  UNKNOWN = "unknown",
}

// Error severity
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Error context
export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, any>
}

// Structured error
export interface StructuredError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  originalError?: any
  context?: ErrorContext
  timestamp: number
}

// Error storage for debugging
const errorLog: StructuredError[] = []

// Maximum number of errors to store
const MAX_ERROR_LOG_SIZE = 100

/**
 * Handle and process an error
 * @param error The error to handle
 * @param type The type of error
 * @param context Additional context about the error
 * @param severity The severity of the error
 * @returns A structured error object
 */
export function handleError(
  error: any,
  type: ErrorType = ErrorType.UNKNOWN,
  context: ErrorContext = {},
  severity: ErrorSeverity = ErrorSeverity.ERROR,
): StructuredError {
  // Create structured error
  const structuredError: StructuredError = {
    type,
    severity,
    message: error?.message || "An unknown error occurred",
    originalError: error,
    context,
    timestamp: Date.now(),
  }

  // Log error to console
  console.error(`[${type.toUpperCase()}] ${structuredError.message}`, {
    severity,
    context,
    error,
  })

  // Store error in log
  storeError(structuredError)

  // Report error to monitoring service if in production
  if (process.env.NODE_ENV === "production") {
    reportError(structuredError)
  }

  return structuredError
}

/**
 * Store error in log for debugging
 * @param error The structured error to store
 */
function storeError(error: StructuredError): void {
  // Only store errors in client
  if (!isClient()) return

  // Add to log
  errorLog.unshift(error)

  // Trim log if too large
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.length = MAX_ERROR_LOG_SIZE
  }

  // Store in session storage for debugging
  try {
    sessionStorage.setItem("error_log", JSON.stringify(errorLog))
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Report error to monitoring service
 * @param error The structured error to report
 */
function reportError(error: StructuredError): void {
  // Implement error reporting to your monitoring service
  // This is a placeholder for your actual implementation
  if (typeof window !== "undefined" && (window as any).errorReporter) {
    ;(window as any).errorReporter.captureError(error)
  }
}

/**
 * Get the error log
 * @returns The error log
 */
export function getErrorLog(): StructuredError[] {
  return [...errorLog]
}

/**
 * Clear the error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0
  if (isClient()) {
    try {
      sessionStorage.removeItem("error_log")
    } catch (e) {
      // Ignore storage errors
    }
  }
}

/**
 * Handle network errors
 * @param error The network error
 * @param context Additional context
 * @returns A structured error
 */
export function handleNetworkError(error: any, context: ErrorContext = {}): StructuredError {
  // Determine if this is a network error
  const isNetworkError =
    error?.message?.includes("network") ||
    error?.message?.includes("fetch") ||
    error?.message?.includes("Failed to fetch") ||
    error?.name === "NetworkError" ||
    error?.name === "AbortError"

  return handleError(error, isNetworkError ? ErrorType.NETWORK : ErrorType.UNKNOWN, context, ErrorSeverity.WARNING)
}

/**
 * Handle authentication errors
 * @param error The authentication error
 * @param context Additional context
 * @returns A structured error
 */
export function handleAuthError(error: any, context: ErrorContext = {}): StructuredError {
  // Determine if this is an auth error
  const isAuthError =
    error?.message?.includes("auth") ||
    error?.message?.includes("authentication") ||
    error?.message?.includes("token") ||
    error?.message?.includes("JWT") ||
    error?.message?.includes("permission") ||
    error?.message?.includes("unauthorized") ||
    error?.status === 401 ||
    error?.status === 403

  return handleError(error, isAuthError ? ErrorType.AUTH : ErrorType.UNKNOWN, context, ErrorSeverity.ERROR)
}

/**
 * Format error message for display
 * @param error The error to format
 * @returns A user-friendly error message
 */
export function formatErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred"

  // If it's a structured error, use its message
  if ((error as StructuredError).type && (error as StructuredError).message) {
    return (error as StructuredError).message
  }

  // If it's an Error object, use its message
  if (error instanceof Error) {
    return error.message
  }

  // If it's a string, use it directly
  if (typeof error === "string") {
    return error
  }

  // If it has a message property, use that
  if (error.message && typeof error.message === "string") {
    return error.message
  }

  // Otherwise, stringify the error
  try {
    return JSON.stringify(error)
  } catch (e) {
    return "An unknown error occurred"
  }
}

/**
 * Create a user-friendly error message
 * @param error The error
 * @param fallback Fallback message if error can't be parsed
 * @returns A user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback

  // Network errors
  if (
    error.message?.includes("network") ||
    error.message?.includes("fetch") ||
    error.message?.includes("Failed to fetch")
  ) {
    return "Network error. Please check your internet connection and try again."
  }

  // Authentication errors
  if (
    error.message?.includes("auth") ||
    error.message?.includes("authentication") ||
    error.message?.includes("token") ||
    error.message?.includes("JWT") ||
    error.status === 401
  ) {
    return "Authentication error. Please sign in again."
  }

  // Permission errors
  if (error.message?.includes("permission") || error.message?.includes("unauthorized") || error.status === 403) {
    return "You don't have permission to perform this action."
  }

  // Not found errors
  if (error.message?.includes("not found") || error.status === 404) {
    return "The requested resource was not found."
  }

  // Validation errors
  if (error.message?.includes("validation") || error.status === 400) {
    return "Please check your input and try again."
  }

  // Server errors
  if (error.status >= 500) {
    return "Server error. Please try again later."
  }

  // Use the error message if available
  if (error.message && typeof error.message === "string") {
    return error.message
  }

  // Fallback
  return fallback
}

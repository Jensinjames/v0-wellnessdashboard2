import { createLogger } from "@/utils/logger"

// Create a dedicated logger for auth errors
const logger = createLogger("AuthErrorHandler")

// Error categories
export enum AuthErrorCategory {
  NETWORK = "network",
  VALIDATION = "validation",
  CREDENTIALS = "credentials",
  RATE_LIMIT = "rate_limit",
  SERVER = "server",
  UNKNOWN = "unknown",
}

// Error types
export enum AuthErrorType {
  // Network errors
  NETWORK_OFFLINE = "network_offline",
  NETWORK_TIMEOUT = "network_timeout",
  NETWORK_FAILED = "network_failed",

  // Validation errors
  INVALID_EMAIL = "invalid_email",
  INVALID_PASSWORD = "invalid_password",
  INVALID_CREDENTIALS = "invalid_credentials",
  PASSWORD_MISMATCH = "password_mismatch",
  PASSWORD_TOO_WEAK = "password_too_weak",
  MISSING_FIELDS = "missing_fields",

  // Credentials errors
  USER_NOT_FOUND = "user_not_found",
  WRONG_PASSWORD = "wrong_password",
  EMAIL_IN_USE = "email_in_use",
  EMAIL_NOT_CONFIRMED = "email_not_confirmed",
  ACCOUNT_LOCKED = "account_locked",

  // Rate limit errors
  TOO_MANY_REQUESTS = "too_many_requests",
  TOO_MANY_ATTEMPTS = "too_many_attempts",

  // Server errors
  SERVER_ERROR = "server_error",
  SERVICE_UNAVAILABLE = "service_unavailable",
  DATABASE_ERROR = "database_error",
  SCHEMA_ERROR = "schema_error", // Added for schema-related errors

  // Unknown errors
  UNKNOWN_ERROR = "unknown_error",
  UNEXPECTED_AUTH_FAILURE = "unexpected_auth_failure",
}

// Auth error interface
export interface AuthErrorInterface {
  category: AuthErrorCategory
  type: AuthErrorType
  message: string
  originalError?: any
  fieldErrors?: Record<string, string>
  timestamp: number
  context?: Record<string, any>
}

// Error tracking
const recentErrors: AuthErrorInterface[] = []
const MAX_RECENT_ERRORS = 10

interface ErrorContext {
  email?: string
  [key: string]: any
}

interface ProcessedError {
  message: string
  code?: string
  context?: ErrorContext
}

/**
 * Processes authentication errors and returns user-friendly messages
 */
export function handleAuthError(error: Error | AuthErrorInterface, context: ErrorContext = {}): ProcessedError {
  // Log the error for debugging
  logger.debug("Processing auth error", { error, context })

  // Handle Supabase Auth errors
  if (error && (error as any).__isAuthError) {
    const authError = error as AuthErrorInterface
    const { message, status, code } = error as any

    // Handle specific error codes
    switch (code) {
      case "invalid_credentials":
        return {
          message: "Invalid email or password. Please check your credentials and try again.",
          code,
          context,
        }
      case "user_not_found":
        return {
          message: "No account found with this email address. Please sign up first.",
          code,
          context,
        }
      case "email_not_confirmed":
        return {
          message: "Please verify your email address before signing in.",
          code,
          context,
        }
      case "unexpected_failure":
        if (status === 500) {
          return {
            message: "Authentication service is temporarily unavailable. Please try again in a moment.",
            code,
            context,
          }
        }
        break
      case "invalid_email":
        return {
          message: "Please enter a valid email address.",
          code,
          context,
        }
      case "weak_password":
        return {
          message: "Password is too weak. Please use a stronger password.",
          code,
          context,
        }
      case "email_taken":
        return {
          message: "An account with this email already exists. Please sign in instead.",
          code,
          context,
        }
      case "rate_limit_exceeded":
        return {
          message: "Too many attempts. Please try again later.",
          code,
          context,
        }
    }

    // For other auth errors, use the message from the error but make it user-friendly
    return {
      message: message.replace(/^error:/i, "").trim() || "Authentication failed. Please try again.",
      code,
      context,
    }
  }

  // Handle network errors
  if (error && error.message && error.message.includes("fetch")) {
    return {
      message: "Unable to connect to the authentication service. Please check your internet connection.",
      context,
    }
  }

  // For other errors, provide a generic message
  return {
    message: error?.message || "An unexpected error occurred. Please try again.",
    context,
  }
}

/**
 * Determines if an error is a temporary/retryable error
 */
export function isRetryableError(error: Error | AuthErrorInterface): boolean {
  // Network errors are retryable
  if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
    return true
  }

  // Supabase 500 errors are retryable
  if ((error as any).__isAuthError) {
    const authError = error as AuthErrorInterface
    return (error as any).status === 500 || (error as any).code === "unexpected_failure"
  }

  return false
}

/**
 * Track an authentication error
 */
export function trackAuthError(error: AuthErrorInterface): void {
  // Add to recent errors
  recentErrors.unshift(error)

  // Keep only the most recent errors
  if (recentErrors.length > MAX_RECENT_ERRORS) {
    recentErrors.pop()
  }

  // Log the error with more context
  logger.error(
    `Auth error: ${error.category}/${error.type}`,
    {
      category: error.category,
      type: error.type,
      message: error.message,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString(),
    },
    error.originalError,
  )
}

/**
 * Get recent authentication errors
 */
export function getRecentAuthErrors(): AuthErrorInterface[] {
  return [...recentErrors]
}

/**
 * Clear recent authentication errors
 */
export function clearRecentAuthErrors(): void {
  recentErrors.length = 0
}

/**
 * Get a user-friendly error message for an authentication error
 */
export function getUserFriendlyAuthErrorMessage(error: any, defaultMessage = "An error occurred"): string {
  // If it's already an AuthError, use its message
  if (error && error.category && error.type) {
    return error.message
  }

  // Otherwise, parse it
  const parsedError = parseAuthError(error)
  return parsedError.message || defaultMessage
}

/**
 * Get field-specific error messages
 */
export function getFieldErrors(error: any): Record<string, string> {
  // If it's already an AuthError with field errors, use them
  if (error && error.fieldErrors) {
    return error.fieldErrors
  }

  // Otherwise, parse it
  const parsedError = parseAuthError(error)
  return parsedError.fieldErrors || {}
}

/**
 * Check if an error is a database schema error
 */
export function isSchemaError(error: any): boolean {
  const parsedError = parseAuthError(error)
  return parsedError.type === AuthErrorType.SCHEMA_ERROR
}

/**
 * Get technical details for support from an error
 */
export function getTechnicalErrorDetails(error: any): string {
  if (!error) return "No error details available"

  const parsedError = error.category && error.type ? error : parseAuthError(error)

  return JSON.stringify(
    {
      category: parsedError.category,
      type: parsedError.type,
      timestamp: new Date(parsedError.timestamp).toISOString(),
      originalMessage: parsedError.originalError?.message || "No original message",
    },
    null,
    2,
  )
}

function parseAuthError(error: any): AuthErrorInterface {
  // Implement your parsing logic here. This is a placeholder.
  // Replace with actual parsing based on your error structure.
  return {
    category: AuthErrorCategory.UNKNOWN,
    type: AuthErrorType.UNKNOWN_ERROR,
    message: error?.message || "Unknown error",
    timestamp: Date.now(),
  }
}

/**
 * Authentication Error Handler
 * Provides utilities for handling authentication errors
 */
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for auth errors
const logger = createLogger("AuthErrors")

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
}

// Auth error interface
export interface AuthError {
  category: AuthErrorCategory
  type: AuthErrorType
  message: string
  originalError?: any
  fieldErrors?: Record<string, string>
  timestamp: number
  context?: Record<string, any>
}

// Error tracking
const recentErrors: AuthError[] = []
const MAX_RECENT_ERRORS = 10

/**
 * Parse an error from Supabase or other sources into a standardized AuthError
 */
export function parseAuthError(error: any, context?: Record<string, any>): AuthError {
  // Default error
  const defaultError: AuthError = {
    category: AuthErrorCategory.UNKNOWN,
    type: AuthErrorType.UNKNOWN_ERROR,
    message: "An unexpected error occurred",
    originalError: error,
    timestamp: Date.now(),
    context,
  }

  // If no error, return default
  if (!error) {
    return defaultError
  }

  // Extract error message
  const errorMessage = error.message || error.error_description || error.error || String(error)

  // Network errors
  if (
    errorMessage.includes("fetch") ||
    errorMessage.includes("network") ||
    errorMessage.includes("Failed to fetch") ||
    error instanceof TypeError
  ) {
    return {
      category: AuthErrorCategory.NETWORK,
      type: navigator.onLine ? AuthErrorType.NETWORK_FAILED : AuthErrorType.NETWORK_OFFLINE,
      message: navigator.onLine
        ? "Network request failed. Please check your connection and try again."
        : "You appear to be offline. Please check your internet connection and try again.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Timeout errors
  if (errorMessage.includes("timeout") || errorMessage.includes("timed out") || error.name === "AbortError") {
    return {
      category: AuthErrorCategory.NETWORK,
      type: AuthErrorType.NETWORK_TIMEOUT,
      message: "The request timed out. Please try again.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Rate limit errors
  if (
    error.status === 429 ||
    errorMessage.includes("429") ||
    errorMessage.includes("too many") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("Too Many Requests")
  ) {
    return {
      category: AuthErrorCategory.RATE_LIMIT,
      type: AuthErrorType.TOO_MANY_REQUESTS,
      message: "Too many requests. Please wait a moment and try again.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Invalid email
  if (
    errorMessage.includes("valid email") ||
    errorMessage.includes("invalid email") ||
    errorMessage.includes("Invalid email")
  ) {
    return {
      category: AuthErrorCategory.VALIDATION,
      type: AuthErrorType.INVALID_EMAIL,
      message: "Please enter a valid email address.",
      originalError: error,
      fieldErrors: { email: "Please enter a valid email address." },
      timestamp: Date.now(),
      context,
    }
  }

  // Invalid password
  if (
    errorMessage.includes("password") &&
    (errorMessage.includes("too short") || errorMessage.includes("too weak") || errorMessage.includes("requirements"))
  ) {
    return {
      category: AuthErrorCategory.VALIDATION,
      type: AuthErrorType.PASSWORD_TOO_WEAK,
      message:
        "Password is too weak. It should be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.",
      originalError: error,
      fieldErrors: {
        password:
          "Password is too weak. It should be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.",
      },
      timestamp: Date.now(),
      context,
    }
  }

  // Email already in use
  if (
    errorMessage.includes("already exists") ||
    errorMessage.includes("already registered") ||
    errorMessage.includes("already in use") ||
    errorMessage.includes("already taken")
  ) {
    return {
      category: AuthErrorCategory.CREDENTIALS,
      type: AuthErrorType.EMAIL_IN_USE,
      message: "This email is already registered. Please sign in or use a different email.",
      originalError: error,
      fieldErrors: { email: "This email is already registered. Please sign in or use a different email." },
      timestamp: Date.now(),
      context,
    }
  }

  // Email not confirmed
  if (
    errorMessage.includes("email not confirmed") ||
    errorMessage.includes("not verified") ||
    errorMessage.includes("verify your email")
  ) {
    return {
      category: AuthErrorCategory.CREDENTIALS,
      type: AuthErrorType.EMAIL_NOT_CONFIRMED,
      message: "Please verify your email address before signing in.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Invalid credentials
  if (
    errorMessage.includes("Invalid login") ||
    errorMessage.includes("Invalid credentials") ||
    errorMessage.includes("incorrect username or password") ||
    errorMessage.includes("Invalid email or password")
  ) {
    return {
      category: AuthErrorCategory.CREDENTIALS,
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: "Invalid email or password. Please check your credentials and try again.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // User not found
  if (errorMessage.includes("user not found") || errorMessage.includes("User not found")) {
    return {
      category: AuthErrorCategory.CREDENTIALS,
      type: AuthErrorType.USER_NOT_FOUND,
      message: "No account found with this email address. Please check your email or sign up.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Database schema errors - specifically check for the user_changes_log error
  if (
    errorMessage.includes('relation "user_changes_log" does not exist') ||
    errorMessage.includes("Database error granting user") ||
    errorMessage.includes("granting user undefined") ||
    (error.__isAuthError && error.status === 500 && error.code === "unexpected_failure")
  ) {
    return {
      category: AuthErrorCategory.SERVER,
      type: AuthErrorType.SCHEMA_ERROR,
      message: "There is a database configuration issue. Please contact support with error code: SCHEMA-001.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Database errors
  if (
    errorMessage.includes("database error") ||
    errorMessage.includes("Database error") ||
    errorMessage.includes("granting user undefined")
  ) {
    return {
      category: AuthErrorCategory.SERVER,
      type: AuthErrorType.DATABASE_ERROR,
      message: "There was a problem with the authentication service. Please try again later.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Server errors
  if (error.status >= 500 || errorMessage.includes("server error") || errorMessage.includes("internal error")) {
    return {
      category: AuthErrorCategory.SERVER,
      type: AuthErrorType.SERVER_ERROR,
      message: "A server error occurred. Please try again later.",
      originalError: error,
      timestamp: Date.now(),
      context,
    }
  }

  // Default to unknown error
  return {
    ...defaultError,
    message: errorMessage || defaultError.message,
  }
}

/**
 * Track an authentication error
 */
export function trackAuthError(error: AuthError): void {
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
export function getRecentAuthErrors(): AuthError[] {
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
 * Handle an authentication error
 * This parses, tracks, and returns the error
 */
export function handleAuthError(error: any, context?: Record<string, any>): AuthError {
  const parsedError = parseAuthError(error, context)
  trackAuthError(parsedError)
  return parsedError
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

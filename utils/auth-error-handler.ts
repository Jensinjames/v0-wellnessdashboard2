/**
 * Authentication Error Handler
 * Provides standardized error handling for authentication operations
 */

import { createLogger } from "@/utils/logger"

// Error categories for analytics and debugging
export enum AuthErrorCategory {
  NETWORK = "network",
  VALIDATION = "validation",
  CREDENTIALS = "credentials",
  RATE_LIMIT = "rate_limit",
  SERVER = "server",
  UNKNOWN = "unknown",
}

// Interface for structured error information
export interface AuthErrorInfo {
  message: string
  category: AuthErrorCategory
  originalError?: any
  code?: string
  context?: Record<string, any>
}

// Logger instance for auth errors
const logger = createLogger("auth-errors")

/**
 * Process authentication errors into user-friendly messages
 * and categorize them for analytics and debugging
 */
export function handleAuthError(error: any, operation: string): AuthErrorInfo {
  // Log the original error for debugging
  logger.error(`Authentication error during ${operation}:`, error)

  // Default error info
  const errorInfo: AuthErrorInfo = {
    message: "An unexpected error occurred. Please try again.",
    category: AuthErrorCategory.UNKNOWN,
    originalError: error,
  }

  // Extract error message if available
  const errorMessage = error?.message || error?.error_description || String(error)

  // Handle network errors
  if (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("Network Error") ||
    errorMessage.includes("network") ||
    errorMessage.includes("offline") ||
    errorMessage.includes("ERR_CONNECTION") ||
    error?.code === "NETWORK_ERROR"
  ) {
    errorInfo.message = "Network error. Please check your internet connection and try again."
    errorInfo.category = AuthErrorCategory.NETWORK
    errorInfo.code = "network_error"
    return errorInfo
  }

  // Handle rate limiting
  if (
    error?.status === 429 ||
    errorMessage.includes("Too Many Requests") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429")
  ) {
    errorInfo.message = "Too many attempts. Please wait a moment before trying again."
    errorInfo.category = AuthErrorCategory.RATE_LIMIT
    errorInfo.code = "rate_limited"
    return errorInfo
  }

  // Handle invalid credentials
  if (
    errorMessage.includes("Invalid login credentials") ||
    errorMessage.includes("Invalid email") ||
    errorMessage.includes("Invalid password") ||
    errorMessage.includes("incorrect password") ||
    error?.status === 400
  ) {
    if (operation === "sign-in") {
      errorInfo.message = "Invalid email or password. Please try again."
      errorInfo.category = AuthErrorCategory.CREDENTIALS
      errorInfo.code = "invalid_credentials"
      return errorInfo
    }
  }

  // Handle email verification errors
  if (
    errorMessage.includes("Email not confirmed") ||
    errorMessage.includes("verify your email") ||
    errorMessage.includes("not verified")
  ) {
    errorInfo.message = "Please verify your email address before signing in."
    errorInfo.category = AuthErrorCategory.VALIDATION
    errorInfo.code = "email_not_verified"
    errorInfo.context = { requiresVerification: true }
    return errorInfo
  }

  // Handle email already in use
  if (errorMessage.includes("already in use") || errorMessage.includes("already exists")) {
    errorInfo.message = "This email is already registered. Please sign in instead."
    errorInfo.category = AuthErrorCategory.VALIDATION
    errorInfo.code = "email_in_use"
    return errorInfo
  }

  // Handle password requirements
  if (
    errorMessage.includes("password") &&
    (errorMessage.includes("requirements") || errorMessage.includes("weak") || errorMessage.includes("strong"))
  ) {
    errorInfo.message = "Password does not meet requirements. Please use a stronger password."
    errorInfo.category = AuthErrorCategory.VALIDATION
    errorInfo.code = "weak_password"
    return errorInfo
  }

  // Handle server errors
  if (error?.status >= 500 || errorMessage.includes("server error")) {
    errorInfo.message = "Server error. Please try again later."
    errorInfo.category = AuthErrorCategory.SERVER
    errorInfo.code = "server_error"
    return errorInfo
  }

  // If we couldn't categorize the error, use the original message if available
  if (errorMessage && errorMessage !== "[object Object]") {
    errorInfo.message = errorMessage
  }

  return errorInfo
}

/**
 * Track authentication errors for analytics
 */
export function trackAuthError(errorInfo: AuthErrorInfo, operation: string): void {
  // Here you would integrate with your analytics system
  // For now, we'll just log it
  logger.info("Auth error tracked:", {
    operation,
    category: errorInfo.category,
    code: errorInfo.code,
    message: errorInfo.message,
  })
}

/**
 * Get field-specific validation errors
 */
export function getFieldErrors(error: any): { email?: string; password?: string } {
  const fieldErrors: { email?: string; password?: string } = {}

  if (!error) return fieldErrors

  const errorMessage = error?.message || String(error)

  // Email-specific errors
  if (errorMessage.includes("email") || errorMessage.includes("Email") || errorMessage.includes("invalid format")) {
    if (errorMessage.includes("already in use") || errorMessage.includes("already exists")) {
      fieldErrors.email = "This email is already registered"
    } else if (errorMessage.includes("valid email") || errorMessage.includes("invalid format")) {
      fieldErrors.email = "Please enter a valid email address"
    }
  }

  // Password-specific errors
  if (errorMessage.includes("password") || errorMessage.includes("Password")) {
    if (errorMessage.includes("too short") || errorMessage.includes("at least")) {
      fieldErrors.password = "Password must be at least 8 characters long"
    } else if (errorMessage.includes("too weak") || errorMessage.includes("strong")) {
      fieldErrors.password = "Please use a stronger password"
    } else if (errorMessage.includes("match") || errorMessage.includes("don't match")) {
      fieldErrors.password = "Passwords do not match"
    }
  }

  return fieldErrors
}

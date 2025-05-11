import { AuthError } from "@supabase/supabase-js"
import { logger } from "@/utils/logger"

// Error categories
export enum AuthErrorCategory {
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  NETWORK = "network",
  DATABASE = "database",
  UNKNOWN = "unknown",
}

// Error types
export enum AuthErrorType {
  INVALID_CREDENTIALS = "invalid_credentials",
  USER_NOT_FOUND = "user_not_found",
  EMAIL_IN_USE = "email_in_use",
  WEAK_PASSWORD = "weak_password",
  INVALID_EMAIL = "invalid_email",
  NETWORK_ERROR = "network_error",
  DATABASE_ERROR = "database_error",
  DATABASE_GRANT_ERROR = "database_grant_error",
  UNKNOWN_ERROR = "unknown_error",
}

// Error response structure
export interface AuthErrorResponse {
  category: AuthErrorCategory
  type: AuthErrorType
  message: string
  originalError?: any
}

/**
 * Parse authentication errors into a standardized format
 */
export function parseAuthError(error: any): AuthErrorResponse {
  // Log the original error for debugging
  logger.debug("Parsing auth error:", error)

  // Default error response
  const defaultError: AuthErrorResponse = {
    category: AuthErrorCategory.UNKNOWN,
    type: AuthErrorType.UNKNOWN_ERROR,
    message: "An unexpected error occurred. Please try again.",
    originalError: error,
  }

  // If not an error object, return default
  if (!error) return defaultError

  // Extract error message
  const errorMessage = error.message || error.error_description || error.toString()

  // Handle Supabase AuthError
  if (error instanceof AuthError) {
    // Invalid login credentials
    if (errorMessage.includes("Invalid login credentials")) {
      return {
        category: AuthErrorCategory.AUTHENTICATION,
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: "The email or password you entered is incorrect.",
        originalError: error,
      }
    }

    // User not found
    if (errorMessage.includes("User not found")) {
      return {
        category: AuthErrorCategory.AUTHENTICATION,
        type: AuthErrorType.USER_NOT_FOUND,
        message: "No account found with this email address.",
        originalError: error,
      }
    }

    // Email already in use
    if (errorMessage.includes("already in use")) {
      return {
        category: AuthErrorCategory.VALIDATION,
        type: AuthErrorType.EMAIL_IN_USE,
        message: "This email is already registered. Please sign in instead.",
        originalError: error,
      }
    }

    // Weak password
    if (errorMessage.includes("password")) {
      return {
        category: AuthErrorCategory.VALIDATION,
        type: AuthErrorType.WEAK_PASSWORD,
        message: "Password must be at least 8 characters and include a mix of letters, numbers, and symbols.",
        originalError: error,
      }
    }
  }

  // Handle network errors
  if (errorMessage.includes("network") || error.name === "NetworkError" || error.code === "NETWORK_ERROR") {
    return {
      category: AuthErrorCategory.NETWORK,
      type: AuthErrorType.NETWORK_ERROR,
      message: "Network error. Please check your internet connection and try again.",
      originalError: error,
    }
  }

  // Handle database errors
  if (errorMessage.includes("database") || errorMessage.includes("Database")) {
    // Specific database grant error
    if (errorMessage.includes("Database error granting user undefined")) {
      return {
        category: AuthErrorCategory.DATABASE,
        type: AuthErrorType.DATABASE_GRANT_ERROR,
        message:
          "There is a database configuration issue with user permissions. Please contact support or try again later.",
        originalError: error,
      }
    }

    return {
      category: AuthErrorCategory.DATABASE,
      type: AuthErrorType.DATABASE_ERROR,
      message: "A database error occurred. Please try again later.",
      originalError: error,
    }
  }

  // Return default for unhandled errors
  return defaultError
}

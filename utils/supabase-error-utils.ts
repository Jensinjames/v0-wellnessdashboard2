// Error types
export enum SupabaseErrorType {
  AUTH = "auth",
  DATABASE = "database",
  STORAGE = "storage",
  NETWORK = "network",
  UNKNOWN = "unknown",
}

// Error severity
export enum ErrorSeverity {
  LOW = "low", // Non-critical errors that don't affect core functionality
  MEDIUM = "medium", // Errors that affect some functionality but not critical paths
  HIGH = "high", // Errors that affect critical functionality
  CRITICAL = "critical", // Errors that make the app unusable
}

// Structured error object
export interface StructuredError {
  type: SupabaseErrorType
  severity: ErrorSeverity
  message: string
  originalError: any
  code?: string
  hint?: string
  recoverable: boolean
  timestamp: Date
}

// Common error codes
const AUTH_ERROR_CODES = [
  "auth/invalid-email",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/wrong-password",
  "auth/email-already-in-use",
  "auth/weak-password",
  "auth/requires-recent-login",
  "auth/too-many-requests",
]

const DATABASE_ERROR_CODES = [
  "PGRST116", // Invalid JWT
  "23505", // Unique violation
  "23503", // Foreign key violation
  "42P01", // Undefined table
  "42703", // Undefined column
  "22P02", // Invalid text representation
]

// Determine if an error is a Supabase error
export function isSupabaseError(error: any): boolean {
  return isAuthError(error) || isPostgrestError(error) || isStorageError(error) || isNetworkError(error)
}

// Check for specific error types
export function isAuthError(error: any): boolean {
  return (
    error?.name === "AuthError" ||
    error?.code?.startsWith("auth/") ||
    error?.message?.includes("auth") ||
    error?.error?.includes("auth")
  )
}

export function isPostgrestError(error: any): boolean {
  return (
    error?.code === "PGRST" ||
    error?.message?.includes("postgrest") ||
    error?.hint?.includes("postgres") ||
    DATABASE_ERROR_CODES.some((code) => error?.code?.includes(code))
  )
}

export function isStorageError(error: any): boolean {
  return error?.name === "StorageError" || error?.message?.includes("storage") || error?.message?.includes("bucket")
}

export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes("network") ||
    error?.message?.includes("fetch") ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("NetworkError") ||
    error?.message?.includes("timeout") ||
    error?.message?.includes("abort")
  )
}

// Determine if an error is recoverable
export function isRecoverableError(error: any): boolean {
  // Network errors are generally recoverable with a retry
  if (isNetworkError(error)) {
    return true
  }

  // Some auth errors are recoverable
  if (isAuthError(error)) {
    // Token expired, invalid token, etc. can be fixed by re-authenticating
    if (
      error?.message?.includes("token") ||
      error?.message?.includes("expired") ||
      error?.message?.includes("invalid") ||
      error?.code === "auth/requires-recent-login"
    ) {
      return true
    }
  }

  // Some database errors are recoverable
  if (isPostgrestError(error)) {
    // Unique violations can be fixed by changing the input
    if (error?.code === "23505") {
      return true
    }
  }

  return false
}

// Get error severity
export function getErrorSeverity(error: any): ErrorSeverity {
  // Auth errors
  if (isAuthError(error)) {
    if (
      error?.message?.includes("token") ||
      error?.message?.includes("expired") ||
      error?.code === "auth/requires-recent-login"
    ) {
      return ErrorSeverity.MEDIUM // User can re-authenticate
    }

    if (error?.code === "auth/too-many-requests") {
      return ErrorSeverity.HIGH // Rate limiting is serious
    }

    return ErrorSeverity.MEDIUM // Most auth errors are medium severity
  }

  // Network errors
  if (isNetworkError(error)) {
    return ErrorSeverity.HIGH // Network errors affect all operations
  }

  // Database errors
  if (isPostgrestError(error)) {
    if (error?.code === "23505") {
      return ErrorSeverity.LOW // Unique violation is a user input issue
    }

    if (error?.code === "42P01" || error?.code === "42703") {
      return ErrorSeverity.CRITICAL // Schema issues are critical
    }

    return ErrorSeverity.HIGH // Most database errors are high severity
  }

  // Storage errors
  if (isStorageError(error)) {
    return ErrorSeverity.MEDIUM // Storage errors usually affect non-critical features
  }

  return ErrorSeverity.MEDIUM // Default to medium for unknown errors
}

// Create a structured error object
export function structureSupabaseError(error: any): StructuredError {
  let type = SupabaseErrorType.UNKNOWN
  let message = "An unexpected error occurred"
  let code = undefined
  let hint = undefined

  if (isAuthError(error)) {
    type = SupabaseErrorType.AUTH
    message = "Authentication error: " + (error.message || "Failed to authenticate")
    code = error.code || "auth/unknown"
    hint = "Try signing in again or check your credentials"
  } else if (isPostgrestError(error)) {
    type = SupabaseErrorType.DATABASE
    message = "Database error: " + (error.message || "Failed to perform database operation")
    code = error.code
    hint = error.hint || "Check your input data and try again"
  } else if (isStorageError(error)) {
    type = SupabaseErrorType.STORAGE
    message = "Storage error: " + (error.message || "Failed to perform storage operation")
    hint = "Check your file and try again"
  } else if (isNetworkError(error)) {
    type = SupabaseErrorType.NETWORK
    message = "Network error: " + (error.message || "Failed to connect to the server")
    hint = "Check your internet connection and try again"
  } else {
    message = error.message || "An unexpected error occurred"
  }

  return {
    type,
    severity: getErrorSeverity(error),
    message,
    originalError: error,
    code,
    hint,
    recoverable: isRecoverableError(error),
    timestamp: new Date(),
  }
}

// Get user-friendly error message
export function getUserFriendlyErrorMessage(error: any): string {
  const structured = structureSupabaseError(error)

  // Return a user-friendly message based on the error type
  switch (structured.type) {
    case SupabaseErrorType.AUTH:
      if (structured.code === "auth/too-many-requests") {
        return "Too many sign-in attempts. Please try again later."
      }
      if (structured.code === "auth/user-not-found" || structured.code === "auth/wrong-password") {
        return "Invalid email or password. Please check your credentials."
      }
      if (structured.code === "auth/email-already-in-use") {
        return "This email is already in use. Please use a different email or try signing in."
      }
      if (structured.message.includes("token") || structured.message.includes("expired")) {
        return "Your session has expired. Please sign in again."
      }
      return "Authentication error. Please try signing in again."

    case SupabaseErrorType.DATABASE:
      if (structured.code === "23505") {
        return "This record already exists. Please try with different information."
      }
      if (structured.code === "23503") {
        return "This operation references a record that doesn't exist."
      }
      return "There was a problem with the database. Please try again."

    case SupabaseErrorType.STORAGE:
      return "There was a problem uploading or downloading your file. Please try again."

    case SupabaseErrorType.NETWORK:
      return "Network connection issue. Please check your internet connection and try again."

    default:
      return "An unexpected error occurred. Please try again later."
  }
}

// Log error for debugging and monitoring
export function logSupabaseError(error: any, context?: string): void {
  const structured = structureSupabaseError(error)

  console.error(
    `[Supabase Error] ${context ? `[${context}] ` : ""}[${structured.type}] [${structured.severity}]:`,
    structured.message,
    {
      code: structured.code,
      hint: structured.hint,
      recoverable: structured.recoverable,
      timestamp: structured.timestamp,
      originalError: structured.originalError,
    },
  )

  // Here you could also send the error to a monitoring service
  // like Sentry, LogRocket, etc.
}

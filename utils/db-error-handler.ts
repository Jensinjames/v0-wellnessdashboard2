/**
 * Utility functions for handling database errors
 */

type DatabaseErrorContext = {
  operation: string
  userId?: string
  details?: Record<string, any>
}

/**
 * Log database errors with context information
 */
export function logDatabaseError(error: any, operation: string, details?: Record<string, any>): void {
  const errorContext: DatabaseErrorContext = {
    operation,
    userId: typeof window !== "undefined" ? localStorage.getItem("supabase.auth.token")?.split('"')[3] : undefined,
    details,
  }

  // Format the error object properly
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    context: errorContext,
    // Include the full error for debugging
    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
  }

  console.error(`Database error during ${operation}:`, errorInfo)
}

/**
 * Format database error messages for user display
 */
export function formatDatabaseErrorMessage(error: any): string {
  // Handle specific error codes
  if (error?.code === "23505") {
    return "This record already exists."
  }

  if (error?.code === "23503") {
    return "This operation references a record that does not exist."
  }

  if (error?.code === "42P01") {
    return "The database is not properly set up. Please contact support."
  }

  if (error?.code === "28000" || error?.code === "28P01") {
    return "Authentication failed. Please check your credentials."
  }

  // Return a user-friendly message or the original error if available
  return error?.message || "An unexpected database error occurred. Please try again."
}

/**
 * Check if an error is a specific type of database error
 */
export function isDuplicateKeyError(error: any): boolean {
  return error?.code === "23505"
}

/**
 * Check if an error is related to a missing table
 */
export function isTableNotFoundError(error: any): boolean {
  return error?.message?.includes("relation") && error?.message?.includes("does not exist")
}

/**
 * Handle common database errors and return appropriate actions
 */
export function handleCommonDatabaseErrors(
  error: any,
  operation: string,
): {
  shouldRetry: boolean
  message: string
} {
  logDatabaseError(error, operation)

  // Determine if we should retry based on error type
  const shouldRetry = !isDuplicateKeyError(error) && !error?.message?.includes("permission denied")

  return {
    shouldRetry,
    message: formatDatabaseErrorMessage(error),
  }
}

/**
 * Safely execute a database operation with error handling
 * @param operation - Function that performs the database operation
 * @param operationName - Name of the operation for error logging
 * @returns Result of the operation or fallback value with error information
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T,
): Promise<{ data: T | null; error: any | null }> {
  try {
    const result = await operation()
    return { data: result, error: null }
  } catch (error) {
    logDatabaseError(error, operationName)
    return {
      data: fallbackValue || null,
      error: {
        message: formatDatabaseErrorMessage(error),
        originalError: error,
      },
    }
  }
}

/**
 * Handles Supabase database errors with user-friendly messages
 * @param error The error object from Supabase
 * @param fallbackMessage A fallback message if the error type is not recognized
 * @returns An object with error information and user-friendly message
 */
export function handleSupabaseError(
  error: any,
  fallbackMessage = "An unexpected database error occurred",
): { message: string; code: string | null; details: any } {
  // No error
  if (!error) {
    return { message: "", code: null, details: null }
  }

  // Extract error code and message
  const code = error.code || (error.error ? error.error.code : null)
  const pgError = error.details || error.message || (error.error ? error.error.message : null)

  // Handle permission errors
  if (
    code === "42501" ||
    code === "PGRST116" ||
    pgError?.includes("permission denied") ||
    pgError?.includes("violates row-level security policy")
  ) {
    return {
      message: "You don't have permission to perform this action",
      code,
      details: pgError,
    }
  }

  // Handle foreign key errors
  if (code === "23503") {
    return {
      message: "This record is referenced by other records and cannot be modified",
      code,
      details: pgError,
    }
  }

  // Handle unique constraint errors
  if (code === "23505") {
    return {
      message: "A record with this information already exists",
      code,
      details: pgError,
    }
  }

  // Handle not found errors
  if (code === "PGRST204") {
    return {
      message: "The requested record was not found",
      code,
      details: pgError,
    }
  }

  // Default error message
  return {
    message: fallbackMessage,
    code,
    details: pgError,
  }
}

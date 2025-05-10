// Supabase Query Utilities
// Helper functions for working with Supabase queries

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { PostgrestError } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseQuery")

// Execute a Supabase query with error handling
export async function executeQuery<T>(
  queryFn: (supabase: ReturnType<typeof createClientComponentClient>) => Promise<{
    data: T | null
    error: PostgrestError | null
  }>,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const supabase = createClientComponentClient()
    const { data, error } = await queryFn(supabase)

    if (error) {
      logger.error("Supabase query error:", error)
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error: any) {
    logger.error("Unexpected error executing Supabase query:", error)
    return { data: null, error: new Error(error.message || "An unexpected error occurred") }
  }
}

// Execute a Supabase mutation with error handling and retries
export async function executeMutation<T>(
  mutationFn: (supabase: ReturnType<typeof createClientComponentClient>) => Promise<{
    data: T | null
    error: PostgrestError | null
  }>,
  retries = 1,
): Promise<{ data: T | null; error: Error | null }> {
  let lastError: Error | null = null
  let attempts = 0

  while (attempts <= retries) {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await mutationFn(supabase)

      if (error) {
        lastError = new Error(error.message)
        logger.error(`Supabase mutation error (attempt ${attempts + 1}/${retries + 1}):`, error)
      } else {
        return { data, error: null }
      }
    } catch (error: any) {
      lastError = new Error(error.message || "An unexpected error occurred")
      logger.error(`Unexpected error executing Supabase mutation (attempt ${attempts + 1}/${retries + 1}):`, error)
    }

    attempts++
    if (attempts <= retries) {
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempts - 1)))
    }
  }

  return { data: null, error: lastError }
}

// Wrap Supabase queries with error handling
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<{ result: T | null; error: Error | null }> {
  return async (...args: Args) => {
    try {
      const result = await fn(...args)
      return { result, error: null }
    } catch (error: any) {
      logger.error("Error in Supabase operation:", error)
      return { result: null, error: new Error(error.message || "An unexpected error occurred") }
    }
  }
}

// Check if a Supabase error is a not found error
export function isNotFoundError(error: PostgrestError | null): boolean {
  return error?.code === "PGRST116" || error?.message.includes("not found")
}

// Check if a Supabase error is a foreign key violation
export function isForeignKeyViolation(error: PostgrestError | null): boolean {
  return error?.code === "23503" || error?.message.includes("foreign key constraint")
}

// Check if a Supabase error is a unique violation
export function isUniqueViolation(error: PostgrestError | null): boolean {
  return error?.code === "23505" || error?.message.includes("unique constraint")
}

// Get a user-friendly error message for a Supabase error
export function getFriendlyErrorMessage(error: PostgrestError | null): string {
  if (!error) return "An unknown error occurred"

  if (isNotFoundError(error)) {
    return "The requested resource was not found"
  }

  if (isForeignKeyViolation(error)) {
    return "This operation references a resource that doesn't exist"
  }

  if (isUniqueViolation(error)) {
    return "A resource with this identifier already exists"
  }

  // Default error message
  return error.message || "An unexpected database error occurred"
}

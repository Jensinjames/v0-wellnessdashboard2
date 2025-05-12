import { createServerClient } from "@/lib/supabase-server"
import { createBrowserClient } from "@/lib/supabase"
import { z } from "zod"

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === "development"

/**
 * Log database operations in development mode
 */
export function logDbOperation(operation: string, details?: any) {
  if (isDevelopment) {
    if (details) {
      console.log(`[DB] ${operation}:`, details)
    } else {
      console.log(`[DB] ${operation}`)
    }
  }
}

/**
 * Handle database errors with consistent error objects
 */
export function handleDbError(error: any, operation: string): DbError {
  // Log the error in development
  if (isDevelopment) {
    console.error(`[DB Error] ${operation}:`, error)
  }

  // Extract error details
  const code = error.code || (error.error ? error.error.code : null)
  const message = error.message || (error.error ? error.error.message : "Unknown database error")
  const details = error.details || null

  // Create a standardized error object
  const dbError: DbError = {
    code,
    message,
    details,
    operation,
  }

  // Return the standardized error
  return dbError
}

/**
 * Get a database client for server-side operations
 */
export function getServerDb() {
  return createServerClient()
}

/**
 * Get a database client for client-side operations
 */
export function getClientDb() {
  return createBrowserClient()
}

/**
 * Standardized database error type
 */
export interface DbError {
  code: string | null
  message: string
  details: any
  operation: string
}

/**
 * Standardized database result type
 */
export interface DbResult<T> {
  data: T | null
  error: DbError | null
}

/**
 * Validate input against a Zod schema
 */
export function validateInput<T>(input: unknown, schema: z.ZodType<T>): { data: T | null; error: string | null } {
  try {
    const validatedData = schema.parse(input)
    return { data: validatedData, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") }
    }
    return { data: null, error: "Invalid input data" }
  }
}

/**
 * Generate a query ID for logging and debugging
 */
export function generateQueryId(): string {
  return `q_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Measure query execution time
 */
export async function measureQueryTime<T>(
  queryName: string,
  queryFn: () => Promise<T>,
): Promise<{ result: T; executionTime: number }> {
  const startTime = performance.now()
  const result = await queryFn()
  const endTime = performance.now()
  const executionTime = endTime - startTime

  if (isDevelopment && executionTime > 500) {
    console.warn(`[DB] Slow query detected: ${queryName} took ${executionTime.toFixed(2)}ms`)
  }

  return { result, executionTime }
}

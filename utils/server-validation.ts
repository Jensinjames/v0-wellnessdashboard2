import type { z } from "zod"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client for logging validation errors
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface ValidationError {
  status: "error"
  message: string
  errors: Record<string, string[]>
  code: "VALIDATION_ERROR"
}

interface ValidationSuccess<T> {
  status: "success"
  data: T
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError

/**
 * Validates data against a Zod schema and returns a typed result
 */
export async function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options?: {
    logErrors?: boolean
    source?: string
  },
): Promise<ValidationResult<T>> {
  const result = await schema.safeParseAsync(data)

  if (!result.success) {
    const { fieldErrors } = result.error.flatten()

    // Format errors as record of field to array of error messages
    const errors: Record<string, string[]> = {}

    for (const [field, messages] of Object.entries(fieldErrors)) {
      errors[field] = messages
    }

    // Log validation errors if requested
    if (options?.logErrors) {
      try {
        await supabase.from("validation_errors").insert({
          source: options.source || "unknown",
          errors,
          input_data: data,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        // Silent failure for logging - shouldn't affect the user
        console.error("Failed to log validation error:", error)
      }
    }

    return {
      status: "error",
      message: "Validation failed",
      errors,
      code: "VALIDATION_ERROR",
    }
  }

  return {
    status: "success",
    data: result.data,
  }
}

/**
 * Handles validation errors in server actions
 */
export function handleValidationError(error: ValidationError) {
  return {
    error: error.message,
    fieldErrors: error.errors,
    code: error.code,
  }
}

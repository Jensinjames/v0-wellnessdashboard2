import { z } from "zod"
import {
  metricSchema,
  categorySchema,
  goalSchema,
  entrySchema,
  categoriesArraySchema,
  goalsArraySchema,
  entriesArraySchema,
  wellnessDataSchema,
  type WellnessMetric,
  type WellnessCategory,
  type WellnessGoal,
  type WellnessEntry,
  type WellnessData,
} from "@/schemas/wellness-schemas"

// Validation result interface
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
  errorMessages?: string[]
}

// Format Zod errors into user-friendly messages
export function formatZodError(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join(".")
    return path ? `${path}: ${err.message}` : err.message
  })
}

// Generic validation function
function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
        errorMessages: formatZodError(error),
      }
    }
    // Handle unexpected errors
    console.error("Unexpected validation error:", error)
    return {
      success: false,
      errorMessages: ["An unexpected error occurred during validation"],
    }
  }
}

// Specific validation functions
export function validateMetric(data: unknown): ValidationResult<WellnessMetric> {
  return validate(metricSchema, data)
}

export function validateCategory(data: unknown): ValidationResult<WellnessCategory> {
  return validate(categorySchema, data)
}

export function validateGoal(data: unknown): ValidationResult<WellnessGoal> {
  return validate(goalSchema, data)
}

export function validateEntry(data: unknown): ValidationResult<WellnessEntry> {
  return validate(entrySchema, data)
}

export function validateCategoriesArray(data: unknown): ValidationResult<WellnessCategory[]> {
  return validate(categoriesArraySchema, data)
}

export function validateGoalsArray(data: unknown): ValidationResult<WellnessGoal[]> {
  return validate(goalsArraySchema, data)
}

export function validateEntriesArray(data: unknown): ValidationResult<WellnessEntry[]> {
  return validate(entriesArraySchema, data)
}

export function validateWellnessData(data: unknown): ValidationResult<WellnessData> {
  return validate(wellnessDataSchema, data)
}

// Safe parsing functions (return default values instead of throwing)
export function safeParseSingle<T>(schema: z.ZodSchema<T>, data: unknown, defaultValue: T): T {
  try {
    return schema.parse(data)
  } catch (error) {
    console.error("Validation error:", error)
    return defaultValue
  }
}

export function safeParseArray<T>(schema: z.ZodSchema<T[]>, data: unknown, defaultValue: T[]): T[] {
  try {
    return schema.parse(data)
  } catch (error) {
    console.error("Validation error:", error)
    return defaultValue
  }
}

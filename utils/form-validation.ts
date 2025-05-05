import { z } from "zod"
import type { ActivityFormData, ValidationResult } from "@/types/forms"

// Validation messages
export const ValidationMessages = {
  required: "This field is required",
  minLength: (field: string, length: number) => `${field} must be at least ${length} characters`,
  maxLength: (field: string, length: number) => `${field} cannot exceed ${length} characters`,
  minValue: (field: string, min: number) => `${field} must be at least ${min}`,
  maxValue: (field: string, max: number) => `${field} cannot exceed ${max}`,
  invalidFormat: (field: string) => `${field} format is invalid`,
  futureDate: "Date cannot be in the future",
  pastDate: "Date cannot be in the past",
  invalidEmail: "Please enter a valid email address",
  passwordMismatch: "Passwords do not match",
  invalidNumber: "Please enter a valid number",
  invalidSelection: "Please make a valid selection",
}

// Helper function to validate text length
export const validateTextLength = (
  value: string,
  options: {
    min?: number
    max?: number
    fieldName?: string
  },
): { valid: boolean; message?: string } => {
  const fieldName = options.fieldName || "Text"

  if (options.min !== undefined && value.length < options.min) {
    return {
      valid: false,
      message: ValidationMessages.minLength(fieldName, options.min),
    }
  }

  if (options.max !== undefined && value.length > options.max) {
    return {
      valid: false,
      message: ValidationMessages.maxLength(fieldName, options.max),
    }
  }

  return { valid: true }
}

// Helper function to validate numeric values
export const validateNumericValue = (
  value: number,
  options: {
    min?: number
    max?: number
    fieldName?: string
  },
): { valid: boolean; message?: string } => {
  const fieldName = options.fieldName || "Value"

  if (options.min !== undefined && value < options.min) {
    return {
      valid: false,
      message: ValidationMessages.minValue(fieldName, options.min),
    }
  }

  if (options.max !== undefined && value > options.max) {
    return {
      valid: false,
      message: ValidationMessages.maxValue(fieldName, options.max),
    }
  }

  return { valid: true }
}

// Helper function to validate dates
export const validateDate = (
  date: Date,
  options: {
    allowFuture?: boolean
    allowPast?: boolean
    minDate?: Date
    maxDate?: Date
  },
): { valid: boolean; message?: string } => {
  const now = new Date()

  if (!options.allowFuture && date > now) {
    return {
      valid: false,
      message: ValidationMessages.futureDate,
    }
  }

  if (!options.allowPast && date < now) {
    return {
      valid: false,
      message: ValidationMessages.pastDate,
    }
  }

  if (options.minDate && date < options.minDate) {
    return {
      valid: false,
      message: `Date cannot be before ${options.minDate.toLocaleDateString()}`,
    }
  }

  if (options.maxDate && date > options.maxDate) {
    return {
      valid: false,
      message: `Date cannot be after ${options.maxDate.toLocaleDateString()}`,
    }
  }

  return { valid: true }
}

// Helper function to collect all form errors
export const collectFormErrors = (formErrors: Record<string, any>, formValues: Record<string, any>): string[] => {
  const errorMessages: string[] = []

  // Recursively collect error messages
  const collectErrors = (errors: Record<string, any>, values: Record<string, any>, path: string[] = []) => {
    Object.entries(errors).forEach(([key, value]) => {
      const currentPath = [...path, key]

      if (value && typeof value === "object" && !value.message) {
        // It's a nested object or array
        if (Array.isArray(value)) {
          // Handle array errors
          value.forEach((item, index) => {
            if (item && typeof item === "object") {
              collectErrors(item, values[key]?.[index] || {}, [...currentPath, index.toString()])
            }
          })
        } else {
          // Handle nested object errors
          collectErrors(value, values[key] || {}, currentPath)
        }
      } else if (value?.message) {
        // It's an error with a message
        const fieldName = currentPath.join(".")
        const readableFieldName = fieldName
          .split(".")
          .map((part) => (isNaN(Number(part)) ? part : `item ${Number(part) + 1}`))
          .join(" ")
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())

        errorMessages.push(`${readableFieldName}: ${value.message}`)
      }
    })
  }

  collectErrors(formErrors, formValues)
  return errorMessages
}

// Create reusable Zod schemas
export const createNumericSchema = (options: {
  fieldName: string
  min?: number
  max?: number
  required?: boolean
}) => {
  let schema = z.number({
    required_error: `${options.fieldName} is required`,
    invalid_type_error: `${options.fieldName} must be a number`,
  })

  if (options.min !== undefined) {
    schema = schema.min(options.min, {
      message: `${options.fieldName} must be at least ${options.min}`,
    })
  }

  if (options.max !== undefined) {
    schema = schema.max(options.max, {
      message: `${options.fieldName} cannot exceed ${options.max}`,
    })
  }

  return options.required ? schema : schema.optional()
}

export const createTextSchema = (options: {
  fieldName: string
  min?: number
  max?: number
  required?: boolean
}) => {
  let schema = z.string({
    required_error: `${options.fieldName} is required`,
    invalid_type_error: `${options.fieldName} must be text`,
  })

  if (options.min !== undefined) {
    schema = schema.min(options.min, {
      message: `${options.fieldName} must be at least ${options.min} characters`,
    })
  }

  if (options.max !== undefined) {
    schema = schema.max(options.max, {
      message: `${options.fieldName} cannot exceed ${options.max} characters`,
    })
  }

  return options.required ? schema : schema.optional()
}

export const createDateSchema = (options: {
  fieldName: string
  allowFuture?: boolean
  allowPast?: boolean
  minDate?: Date
  maxDate?: Date
  required?: boolean
}) => {
  let schema = z.date({
    required_error: `${options.fieldName} is required`,
    invalid_type_error: `${options.fieldName} must be a valid date`,
  })

  if (!options.allowFuture) {
    schema = schema.refine((date) => date <= new Date(), { message: `${options.fieldName} cannot be in the future` })
  }

  if (!options.allowPast) {
    schema = schema.refine((date) => date >= new Date(), { message: `${options.fieldName} cannot be in the past` })
  }

  if (options.minDate) {
    schema = schema.refine((date) => date >= options.minDate!, {
      message: `${options.fieldName} cannot be before ${options.minDate!.toLocaleDateString()}`,
    })
  }

  if (options.maxDate) {
    schema = schema.refine((date) => date <= options.maxDate!, {
      message: `${options.fieldName} cannot be after ${options.maxDate!.toLocaleDateString()}`,
    })
  }

  return options.required ? schema : schema.optional()
}

// Activity form validation schema
export const activityFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  intensity: z.number().min(1, "Intensity must be at least 1").max(5, "Intensity cannot exceed 5"),
  date: z.date(),
  value: z.number().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  reminder: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

// Activity form validation function
export const validateActivityForm = (data: Partial<ActivityFormData>): ValidationResult => {
  const errors: Record<string, string> = {}

  // Required fields
  if (!data.category || data.category.trim() === "") {
    errors.category = "Category is required"
  }

  // Validate duration
  if (data.duration === undefined || data.duration < 1) {
    errors.duration = "Duration must be at least 1 minute"
  }

  // Validate intensity if provided
  if (data.intensity !== undefined && (data.intensity < 1 || data.intensity > 5)) {
    errors.intensity = "Intensity must be between 1 and 5"
  }

  // Validate notes length if provided
  if (data.notes && data.notes.length > 200) {
    errors.notes = "Notes cannot exceed 200 characters"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Wellness entry form validation schema
export const wellnessEntryFormSchema = z.object({
  date: z.date(),
  metrics: z.array(
    z.object({
      categoryId: z.string(),
      metricId: z.string(),
      value: z.number(),
    }),
  ),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
})

// Category form validation schema
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  description: z.string().min(1, "Description is required").max(200, "Description cannot exceed 200 characters"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
  enabled: z.boolean().default(true),
})

// Metric form validation schema
export const metricFormSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
  unit: z.string().min(1, "Unit is required"),
  min: z.number().min(0, "Minimum value must be at least 0"),
  max: z.number().min(1, "Maximum value must be at least 1"),
  step: z.number().min(0.1, "Step must be at least 0.1"),
  defaultValue: z.number(),
  defaultGoal: z.number(),
})

// Goal form validation schema
export const goalFormSchema = z.object({
  goals: z.array(
    z.object({
      categoryId: z.string(),
      metricId: z.string(),
      value: z.number(),
      enabled: z.boolean(),
    }),
  ),
  categorySettings: z.array(
    z.object({
      id: z.string(),
      enabled: z.boolean(),
    }),
  ),
})

// Export settings form validation schema
export const exportFormSchema = z.object({
  format: z.enum(["csv", "json", "pdf"]),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
    preset: z.enum(["today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth", "custom"]).optional(),
  }),
  includeCategories: z.array(z.string()),
  includeNotes: z.boolean(),
  includeMetadata: z.boolean(),
})

// User settings form validation schema
export const userSettingsFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    reminders: z.boolean(),
  }),
  privacySettings: z.object({
    shareData: z.boolean(),
    anonymizeData: z.boolean(),
  }),
  unitPreferences: z.object({
    distance: z.enum(["km", "mi"]),
    weight: z.enum(["kg", "lb"]),
    temperature: z.enum(["c", "f"]),
  }),
})

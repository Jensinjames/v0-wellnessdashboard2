import { z } from "zod"
import type { ActivityFormData, ValidationResult } from "@/types/forms"

// Validation messages
export const ValidationMessages = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, length: number) => `${field} must be at least ${length} characters`,
  maxLength: (field: string, length: number) => `${field} cannot exceed ${length} characters`,
  minValue: (field: string, min: number) => `${field} must be at least ${min}`,
  maxValue: (field: string, max: number) => `${field} cannot exceed ${max}`,
  invalidFormat: (field: string) => `${field} format is invalid`,
  futureDate: "Date cannot be in the future",
  pastDate: (days: number) => `Date cannot be more than ${days} days in the past`,
  invalidEmail: "Please enter a valid email address",
  passwordMismatch: "Passwords do not match",
  invalidNumber: "Please enter a valid number",
  invalidSelection: "Please make a valid selection",
  invalidDate: "Please enter a valid date",
  requiredSelection: "Please select an option",
  invalidRange: (min: number, max: number) => `Value must be between ${min} and ${max}`,
  invalidPattern: (pattern: string) => `Input does not match the required pattern: ${pattern}`,
  invalidOption: (options: string[]) => `Please select one of the following options: ${options.join(", ")}`,
}

// Helper function to validate text length with more descriptive messages
export const validateTextLength = (
  value: string,
  options: {
    min?: number
    max?: number
    fieldName?: string
    required?: boolean
  },
): { valid: boolean; message?: string } => {
  const fieldName = options.fieldName || "Text"

  if (options.required && (!value || value.trim() === "")) {
    return {
      valid: false,
      message: ValidationMessages.required(fieldName),
    }
  }

  if (value && options.min !== undefined && value.length < options.min) {
    return {
      valid: false,
      message: ValidationMessages.minLength(fieldName, options.min),
    }
  }

  if (value && options.max !== undefined && value.length > options.max) {
    return {
      valid: false,
      message: ValidationMessages.maxLength(fieldName, options.max),
    }
  }

  return { valid: true }
}

// Helper function to validate numeric values with more descriptive messages
export const validateNumericValue = (
  value: number,
  options: {
    min?: number
    max?: number
    fieldName?: string
    required?: boolean
  },
): { valid: boolean; message?: string } => {
  const fieldName = options.fieldName || "Value"

  if (options.required && (value === undefined || value === null)) {
    return {
      valid: false,
      message: ValidationMessages.required(fieldName),
    }
  }

  if (isNaN(value)) {
    return {
      valid: false,
      message: ValidationMessages.invalidNumber,
    }
  }

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

// Helper function to validate dates with more descriptive messages
export const validateDate = (
  date: Date,
  options: {
    allowFuture?: boolean
    allowPast?: boolean
    maxPastDays?: number
    minDate?: Date
    maxDate?: Date
    fieldName?: string
    required?: boolean
  },
): { valid: boolean; message?: string } => {
  const fieldName = options.fieldName || "Date"
  const now = new Date()

  if (options.required && !date) {
    return {
      valid: false,
      message: ValidationMessages.required(fieldName),
    }
  }

  if ((date && !(date instanceof Date)) || (date && isNaN(date.getTime()))) {
    return {
      valid: false,
      message: ValidationMessages.invalidDate,
    }
  }

  if (date && !options.allowFuture && date > now) {
    return {
      valid: false,
      message: ValidationMessages.futureDate,
    }
  }

  if (date && !options.allowPast && options.maxPastDays) {
    const minDate = new Date()
    minDate.setDate(now.getDate() - options.maxPastDays)

    if (date < minDate) {
      return {
        valid: false,
        message: ValidationMessages.pastDate(options.maxPastDays),
      }
    }
  }

  if (date && options.minDate && date < options.minDate) {
    return {
      valid: false,
      message: `${fieldName} cannot be before ${options.minDate.toLocaleDateString()}`,
    }
  }

  if (date && options.maxDate && date > options.maxDate) {
    return {
      valid: false,
      message: `${fieldName} cannot be after ${options.maxDate.toLocaleDateString()}`,
    }
  }

  return { valid: true }
}

// Helper function to collect all form errors with more descriptive messages
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
          .replace(/_/g, " ")

        errorMessages.push(`${readableFieldName}: ${value.message}`)
      }
    })
  }

  collectErrors(formErrors, formValues)
  return errorMessages
}

// Activity form validation function with more descriptive error messages
export const validateActivityForm = (data: Partial<ActivityFormData>): ValidationResult => {
  const errors: Record<string, string> = {}

  // Validate category (required)
  if (!data.category || data.category.trim() === "") {
    errors.category = "Please select an activity category"
  }

  // Validate date
  if (data.date) {
    const dateValidation = validateDate(data.date, {
      allowFuture: false,
      maxPastDays: 30,
      fieldName: "Activity date",
    })

    if (!dateValidation.valid && dateValidation.message) {
      errors.date = dateValidation.message
    }
  }

  // Validate duration (required, min value)
  if (data.duration === undefined || data.duration === null) {
    errors.duration = "Duration is required"
  } else if (data.duration < 1) {
    errors.duration = "Duration must be at least 1 minute"
  } else if (data.duration > 1440) {
    errors.duration = "Duration cannot exceed 1440 minutes (24 hours)"
  }

  // Validate intensity if provided
  if (data.intensity !== undefined) {
    const intensityValidation = validateNumericValue(data.intensity, {
      min: 1,
      max: 5,
      fieldName: "Intensity level",
    })

    if (!intensityValidation.valid && intensityValidation.message) {
      errors.intensity = intensityValidation.message
    }
  }

  // Validate notes length if provided
  if (data.notes) {
    const notesValidation = validateTextLength(data.notes, {
      max: 200,
      fieldName: "Notes",
    })

    if (!notesValidation.valid && notesValidation.message) {
      errors.notes = notesValidation.message
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Create reusable Zod schemas with more descriptive error messages
export const createNumberSchema = (options: {
  fieldName: string
  min?: number
  max?: number
  required?: boolean
}) => {
  let schema = z.number({
    required_error: ValidationMessages.required(options.fieldName),
    invalid_type_error: `${options.fieldName} must be a number`,
  })

  if (options.min !== undefined) {
    schema = schema.min(options.min, {
      message: ValidationMessages.minValue(options.fieldName, options.min),
    })
  }

  if (options.max !== undefined) {
    schema = schema.max(options.max, {
      message: ValidationMessages.maxValue(options.fieldName, options.max),
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
    required_error: ValidationMessages.required(options.fieldName),
    invalid_type_error: `${options.fieldName} must be text`,
  })

  if (options.min !== undefined) {
    schema = schema.min(options.min, {
      message: ValidationMessages.minLength(options.fieldName, options.min),
    })
  }

  if (options.max !== undefined) {
    schema = schema.max(options.max, {
      message: ValidationMessages.maxLength(options.fieldName, options.max),
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
    required_error: ValidationMessages.required(options.fieldName),
    invalid_type_error: `${options.fieldName} must be a valid date`,
  })

  if (!options.allowFuture) {
    schema = schema.refine((date) => date <= new Date(), {
      message: ValidationMessages.futureDate,
    })
  }

  if (!options.allowPast) {
    schema = schema.refine((date) => date >= new Date(), {
      message: ValidationMessages.pastDate(0),
    })
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

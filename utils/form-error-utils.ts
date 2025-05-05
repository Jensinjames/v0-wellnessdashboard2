import type { ValidationResult } from "@/types/forms"

/**
 * Formats an error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred"
}

/**
 * Extracts field errors from a validation result
 */
export function getFieldErrors(validationResult: ValidationResult): Record<string, string> {
  return validationResult.errors || {}
}

/**
 * Checks if a specific field has an error
 */
export function hasFieldError(errors: Record<string, string>, fieldName: string): boolean {
  return !!errors[fieldName]
}

/**
 * Gets the error message for a specific field
 */
export function getFieldErrorMessage(errors: Record<string, string>, fieldName: string): string | undefined {
  return errors[fieldName]
}

/**
 * Formats all errors into a list of messages
 */
export function formatErrorMessages(errors: Record<string, string>): string[] {
  return Object.entries(errors).map(([field, message]) => {
    // Convert camelCase to sentence case
    const formattedField = field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())

    return `${formattedField}: ${message}`
  })
}

/**
 * Scrolls to the first error in the form
 */
export function scrollToFirstError(errors: Record<string, string>): void {
  if (Object.keys(errors).length === 0) return

  const firstErrorField = Object.keys(errors)[0]
  const element = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`)

  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" })

    // Try to focus the element if it's an input
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.focus()
    }
  }
}

/**
 * Creates aria attributes for form fields based on validation state
 */
export function getAriaAttributes(
  fieldName: string,
  errors: Record<string, string>,
): { "aria-invalid"?: boolean; "aria-describedby"?: string } {
  const hasError = hasFieldError(errors, fieldName)

  if (!hasError) {
    return {}
  }

  return {
    "aria-invalid": true,
    "aria-describedby": `${fieldName}-error`,
  }
}

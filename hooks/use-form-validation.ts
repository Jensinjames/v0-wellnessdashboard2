"use client"

import { useEffect, useRef } from "react"

interface UseFormValidationProps {
  errors: Record<string, any>
  isSubmitting?: boolean
  isSubmitted?: boolean
  isValid?: boolean
}

export function useFormValidation({
  errors,
  isSubmitting = false,
  isSubmitted = false,
  isValid = true,
}: UseFormValidationProps) {
  const firstErrorRef = useRef<string | null>(null)
  const hasErrors = Object.keys(errors).length > 0

  // Find the first error field when errors change
  useEffect(() => {
    if (hasErrors) {
      firstErrorRef.current = Object.keys(errors)[0]
    } else {
      firstErrorRef.current = null
    }
  }, [errors, hasErrors])

  // Scroll to first error after submission if there are errors
  useEffect(() => {
    if (isSubmitted && !isSubmitting && hasErrors && firstErrorRef.current) {
      const errorFieldId = firstErrorRef.current
      const errorField =
        document.getElementById(errorFieldId) ||
        document.querySelector(`[name="${errorFieldId}"]`) ||
        document.querySelector(`[id$="-${errorFieldId}"]`)

      if (errorField) {
        // Scroll the element into view
        errorField.scrollIntoView({ behavior: "smooth", block: "center" })

        // Try to focus the element if it's an input
        if (
          errorField instanceof HTMLInputElement ||
          errorField instanceof HTMLSelectElement ||
          errorField instanceof HTMLTextAreaElement
        ) {
          errorField.focus()
        }
      } else {
        // If we can't find the field, scroll to the error summary
        const errorSummary = document.getElementById("form-error-summary")
        if (errorSummary) {
          errorSummary.scrollIntoView({ behavior: "smooth", block: "start" })
          errorSummary.focus()
        }
      }
    }
  }, [isSubmitted, isSubmitting, hasErrors])

  return {
    hasErrors,
    firstErrorField: firstErrorRef.current,
    isFormValid: isValid && !hasErrors,
  }
}

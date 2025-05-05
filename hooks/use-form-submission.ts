"use client"

import { useState, useCallback } from "react"
import type { ValidationResult, SubmissionResult } from "@/types/forms"

interface FormSubmissionOptions<TData, TResult> {
  onValidate?: (data: TData) => ValidationResult | Promise<ValidationResult>
  onSubmit: (data: TData) => Promise<SubmissionResult<TResult>>
  onSuccess?: (result: SubmissionResult<TResult>) => void
  onError?: (error: Error | unknown) => void
}

interface FormSubmissionState<TResult> {
  isSubmitting: boolean
  isSubmitted: boolean
  isSuccess: boolean
  errors: Record<string, string>
  result: SubmissionResult<TResult> | null
}

export function useFormSubmission<TData, TResult = any>(options: FormSubmissionOptions<TData, TResult>) {
  const [state, setState] = useState<FormSubmissionState<TResult>>({
    isSubmitting: false,
    isSubmitted: false,
    isSuccess: false,
    errors: {},
    result: null,
  })

  const submit = useCallback(
    async (data: TData) => {
      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        errors: {},
      }))

      try {
        // Validate the form data if a validation function is provided
        if (options.onValidate) {
          const validationResult = await options.onValidate(data)

          if (!validationResult.valid) {
            setState((prev) => ({
              ...prev,
              isSubmitting: false,
              isSubmitted: true,
              isSuccess: false,
              errors: validationResult.errors || {},
            }))
            return false
          }
        }

        // Submit the form data
        const result = await options.onSubmit(data)

        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          isSubmitted: true,
          isSuccess: result.success,
          result,
          errors: result.errors || {},
        }))

        if (result.success && options.onSuccess) {
          options.onSuccess(result)
        }

        return result.success
      } catch (error) {
        console.error("Form submission error:", error)

        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          isSubmitted: true,
          isSuccess: false,
          errors: {
            form: "An unexpected error occurred. Please try again.",
          },
        }))

        if (options.onError) {
          options.onError(error)
        }

        return false
      }
    },
    [options],
  )

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSubmitted: false,
      isSuccess: false,
      errors: {},
      result: null,
    })
  }, [])

  return {
    ...state,
    submit,
    reset,
  }
}

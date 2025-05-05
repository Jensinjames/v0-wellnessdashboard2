"use client"

import { useEffect, useRef } from "react"
import type { UseFormReturn, FieldValues, SubmitHandler, SubmitErrorHandler } from "react-hook-form"
import { trackFormEvent } from "@/services/form-analytics"

interface UseFormAnalyticsOptions<TFieldValues extends FieldValues> {
  formId: string
  onSubmit: SubmitHandler<TFieldValues>
  onError?: SubmitErrorHandler<TFieldValues>
  metadata?: Record<string, any>
}

export function useFormAnalytics<TFieldValues extends FieldValues>(
  formMethods: UseFormReturn<TFieldValues>,
  options: UseFormAnalyticsOptions<TFieldValues>,
) {
  const { formId, onSubmit, onError, metadata } = options
  const startTimeRef = useRef<number>(0)

  // Track when form validation errors occur
  useEffect(() => {
    const subscription = formMethods.watch(() => {
      const errors = formMethods.formState.errors

      // Only track errors after a submission attempt
      if (formMethods.formState.isSubmitted && Object.keys(errors).length > 0) {
        // Track each field error
        Object.entries(errors).forEach(([fieldName, error]) => {
          if (error?.message) {
            trackFormEvent({
              formId,
              eventType: "field_error",
              fieldName,
              errorMessage: error.message as string,
              metadata,
            })
          }
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [formMethods, formId, metadata])

  // Enhanced submit handler
  const handleSubmit = async (data: TFieldValues) => {
    try {
      // Track submission attempt
      trackFormEvent({
        formId,
        eventType: "attempt",
        metadata,
      })

      startTimeRef.current = Date.now()

      // Call original submit handler
      await onSubmit(data)

      // Track successful submission
      const duration = Date.now() - startTimeRef.current
      trackFormEvent({
        formId,
        eventType: "success",
        duration,
        metadata,
      })
    } catch (error) {
      // Track submission error
      trackFormEvent({
        formId,
        eventType: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        metadata,
      })

      // Re-throw to allow error handling
      throw error
    }
  }

  // Enhanced error handler
  const handleError: SubmitErrorHandler<TFieldValues> = (errors) => {
    // Track each field error
    Object.entries(errors).forEach(([fieldName, error]) => {
      if (error?.message) {
        trackFormEvent({
          formId,
          eventType: "field_error",
          fieldName,
          errorMessage: error.message as string,
          metadata,
        })
      }
    })

    // Call original error handler if provided
    if (onError) {
      onError(errors)
    }
  }

  return {
    ...formMethods,
    handleSubmit: (onValid?: typeof onSubmit) => formMethods.handleSubmit(onValid || handleSubmit, handleError),
  }
}

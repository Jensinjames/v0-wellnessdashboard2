"use client"

import { useState, useEffect, useMemo } from "react"
import type { UserProfile, ProfileFormData, ProfileCompletionStatus } from "@/types/auth"
import { validateProfileData } from "@/utils/profile-utils"

/**
 * Hook for validating profile form data
 */
export function useProfileValidation(formData: ProfileFormData) {
  const [errors, setErrors] = useState<Record<string, string> | null>(null)
  const [isDirty, setIsDirty] = useState<Record<string, boolean>>({})

  // Validate on form data change
  useEffect(() => {
    const validationErrors = validateProfileData(formData)
    setErrors(validationErrors)
  }, [formData])

  // Mark field as dirty when it's touched
  const markFieldAsDirty = (fieldName: string) => {
    setIsDirty((prev) => ({
      ...prev,
      [fieldName]: true,
    }))
  }

  // Get error for a specific field, but only if it's dirty
  const getFieldError = (fieldName: string): string | undefined => {
    if (!isDirty[fieldName]) return undefined
    return errors?.[fieldName]
  }

  // Check if the form is valid
  const isValid = errors === null

  return {
    errors,
    isValid,
    markFieldAsDirty,
    getFieldError,
    isDirty,
  }
}

/**
 * Hook for tracking profile completion status
 */
export function useProfileCompletion(profile: UserProfile | null): ProfileCompletionStatus {
  return useMemo(() => {
    if (!profile) {
      return {
        isComplete: false,
        missingFields: ["first_name", "last_name"],
        completionPercentage: 0,
      }
    }

    const requiredFields = ["first_name", "last_name"]
    const optionalFields = ["avatar_url"]
    const allFields = [...requiredFields, ...optionalFields]

    // Check which required fields are missing
    const missingFields = requiredFields.filter((field) => {
      const value = profile[field as keyof UserProfile]
      return !value || (typeof value === "string" && value.trim() === "")
    })

    // Calculate completion percentage
    const filledFields = allFields.filter((field) => {
      const value = profile[field as keyof UserProfile]
      return value && (typeof value !== "string" || value.trim() !== "")
    }).length

    const completionPercentage = Math.round((filledFields / allFields.length) * 100)

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage,
    }
  }, [profile])
}

/**
 * Hook for validating profile updates
 */
export function useProfileUpdateValidation() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<Error | null>(null)

  const validateUpdate = async <T extends ProfileFormData>(
    formData: T,
    updateFn: (data: T) => Promise<{ error: Error | null }>,
  ) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Validate the form data
      const validationErrors = validateProfileData(formData)

      if (validationErrors) {
        setSubmitError(new Error("Please fix the validation errors before submitting"))
        return { success: false, error: new Error("Validation failed") }
      }

      // Submit the update
      const { error } = await updateFn(formData)

      if (error) {
        setSubmitError(error)
        return { success: false, error }
      }

      return { success: true, error: null }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      setSubmitError(errorObj)
      return { success: false, error: errorObj }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    submitError,
    validateUpdate,
  }
}

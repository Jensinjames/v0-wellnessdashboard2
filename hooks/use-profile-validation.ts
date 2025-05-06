"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import type { UserProfile, ProfileFormData, ProfileCompletionStatus } from "@/types/auth"
import { validateProfileData } from "@/utils/profile-utils"
import { useAuth } from "@/context/auth-context"

/**
 * Hook for validating profile form data
 */
export function useProfileValidation(formData: ProfileFormData) {
  const [errors, setErrors] = useState<Record<string, string> | null>(null)
  const [isDirty, setIsDirty] = useState<Record<string, boolean>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Validate on form data change
  useEffect(() => {
    const validationErrors = validateProfileData(formData)
    setErrors(validationErrors)
  }, [formData])

  // Mark field as dirty when it's touched
  const markFieldAsDirty = useCallback((fieldName: string) => {
    setIsDirty((prev) => ({
      ...prev,
      [fieldName]: true,
    }))
    setTouchedFields((prev) => {
      const newSet = new Set(prev)
      newSet.add(fieldName)
      return newSet
    })
  }, [])

  // Mark all fields as dirty
  const markAllFieldsAsDirty = useCallback(() => {
    const allFields = Object.keys(formData)
    const dirtyState: Record<string, boolean> = {}
    const newTouchedFields = new Set<string>()

    allFields.forEach((field) => {
      dirtyState[field] = true
      newTouchedFields.add(field)
    })

    setIsDirty(dirtyState)
    setTouchedFields(newTouchedFields)
  }, [formData])

  // Get error for a specific field, but only if it's dirty
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      if (!isDirty[fieldName]) return undefined
      return errors?.[fieldName]
    },
    [errors, isDirty],
  )

  // Check if the form is valid
  const isValid = errors === null

  // Check if the form has been modified
  const isModified = useMemo(() => touchedFields.size > 0, [touchedFields])

  return {
    errors,
    isValid,
    isModified,
    markFieldAsDirty,
    markAllFieldsAsDirty,
    getFieldError,
    isDirty,
    touchedFields: Array.from(touchedFields),
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
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const validateUpdate = async <T extends ProfileFormData>(
    formData: T,
    updateFn: (data: T) => Promise<{ error: Error | null }>,
  ) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

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

      setSubmitSuccess(true)
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
    submitSuccess,
    validateUpdate,
    resetSubmitState: () => {
      setSubmitError(null)
      setSubmitSuccess(false)
    },
  }
}

/**
 * Combined hook for profile management
 */
export function useProfileManager() {
  const { profile, refreshProfile } = useAuth()
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    avatar_url: profile?.avatar_url || null,
  })

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        avatar_url: profile.avatar_url || null,
      })
    }
  }, [profile])

  const validation = useProfileValidation(formData)
  const updateValidation = useProfileUpdateValidation()
  const completionStatus = useProfileCompletion(profile)

  // Handle form field changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Handle form field blur
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      validation.markFieldAsDirty(e.target.name)
    },
    [validation],
  )

  return {
    profile,
    formData,
    setFormData,
    handleChange,
    handleBlur,
    refreshProfile,
    ...validation,
    ...updateValidation,
    completionStatus,
  }
}

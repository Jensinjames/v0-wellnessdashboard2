"use client"

import { useState, useCallback } from "react"
import { useFormSubmission } from "./use-form-submission"
import { validateActivityForm } from "@/utils/form-validation"
import { generateId } from "@/utils/id-generator"
import type { ActivityFormData } from "@/types/forms"

interface UseActivityFormOptions {
  initialData?: Partial<ActivityFormData>
  onSuccess?: (data: ActivityFormData) => void
}

export function useActivityForm(options: UseActivityFormOptions = {}) {
  const [formData, setFormData] = useState<ActivityFormData>({
    title: "",
    category: "",
    date: new Date(),
    duration: 30,
    intensity: 3,
    notes: "",
    reminder: false,
    ...options.initialData,
  })

  // Handle form field changes
  const handleChange = useCallback((field: keyof ActivityFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Load saved activities from localStorage
  const loadActivities = useCallback((): ActivityFormData[] => {
    try {
      const savedActivities = localStorage.getItem("activities")
      return savedActivities ? JSON.parse(savedActivities) : []
    } catch (e) {
      console.error("Error loading activities:", e)
      return []
    }
  }, [])

  // Save activities to localStorage
  const saveActivities = useCallback((activities: ActivityFormData[]) => {
    try {
      localStorage.setItem("activities", JSON.stringify(activities))
      return true
    } catch (e) {
      console.error("Error saving activities:", e)
      return false
    }
  }, [])

  // Form submission handler
  const formSubmission = useFormSubmission<ActivityFormData>({
    onValidate: validateActivityForm,
    onSubmit: async (data) => {
      // Create a new activity with an ID if it doesn't have one
      const newActivity: ActivityFormData = {
        ...data,
        id: data.id || generateId(),
      }

      // Get existing activities and add the new one
      const activities = loadActivities()
      const updatedActivities = [...activities, newActivity]

      // Save to localStorage
      const success = saveActivities(updatedActivities)

      return {
        success,
        data: newActivity,
        message: success ? "Activity saved successfully!" : "Failed to save activity",
      }
    },
    onSuccess: (result) => {
      // Reset form after successful submission
      setFormData({
        title: "",
        category: "",
        date: new Date(),
        duration: 30,
        intensity: 3,
        notes: "",
        reminder: false,
      })

      // Call the onSuccess callback if provided
      if (options.onSuccess && result.data) {
        options.onSuccess(result.data)
      }
    },
  })

  return {
    formData,
    handleChange,
    setFormData,
    ...formSubmission,
    loadActivities,
  }
}

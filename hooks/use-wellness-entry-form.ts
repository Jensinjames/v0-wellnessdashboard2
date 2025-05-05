"use client"

import { useState, useCallback } from "react"
import { useFormSubmission } from "./use-form-submission"
import { useWellness } from "@/context/wellness-context"
import type { WellnessEntryFormData } from "@/types/forms"

interface UseWellnessEntryFormOptions {
  initialData?: Partial<WellnessEntryFormData>
  onSuccess?: (data: WellnessEntryFormData) => void
}

export function useWellnessEntryForm(options: UseWellnessEntryFormOptions = {}) {
  const { addEntry, updateEntry } = useWellness()

  const [formData, setFormData] = useState<WellnessEntryFormData>({
    date: new Date(),
    metrics: [],
    notes: "",
    ...options.initialData,
  })

  // Handle form field changes
  const handleChange = useCallback((field: keyof WellnessEntryFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Handle metric value changes
  const handleMetricChange = useCallback((categoryId: string, metricId: string, value: number) => {
    setFormData((prev) => {
      const metrics = [...prev.metrics]
      const existingIndex = metrics.findIndex((m) => m.categoryId === categoryId && m.metricId === metricId)

      if (existingIndex >= 0) {
        // Update existing metric
        metrics[existingIndex] = {
          ...metrics[existingIndex],
          value,
        }
      } else {
        // Add new metric
        metrics.push({
          categoryId,
          metricId,
          value,
        })
      }

      return {
        ...prev,
        metrics,
      }
    })
  }, [])

  // Validate the form data
  const validateForm = useCallback((data: WellnessEntryFormData) => {
    const errors: Record<string, string> = {}

    // Ensure we have at least one metric
    if (data.metrics.length === 0) {
      errors.metrics = "At least one metric must be recorded"
    }

    // Validate date
    if (!data.date) {
      errors.date = "Date is required"
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }, [])

  // Form submission handler
  const formSubmission = useFormSubmission<WellnessEntryFormData>({
    onValidate: validateForm,
    onSubmit: async (data) => {
      try {
        if (data.id) {
          // Update existing entry
          updateEntry(data.id, data)
        } else {
          // Add new entry
          addEntry({
            ...data,
            id: crypto.randomUUID(),
          })
        }

        return {
          success: true,
          data,
          message: data.id ? "Entry updated successfully!" : "Entry added successfully!",
        }
      } catch (error) {
        console.error("Error saving wellness entry:", error)
        return {
          success: false,
          message: "Failed to save wellness entry",
        }
      }
    },
    onSuccess: (result) => {
      // Reset form after successful submission if it's a new entry
      if (!formData.id) {
        setFormData({
          date: new Date(),
          metrics: [],
          notes: "",
        })
      }

      // Call the onSuccess callback if provided
      if (options.onSuccess && result.data) {
        options.onSuccess(result.data)
      }
    },
  })

  return {
    formData,
    handleChange,
    handleMetricChange,
    setFormData,
    ...formSubmission,
  }
}

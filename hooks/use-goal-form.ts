"use client"

import { useState, useCallback, useEffect } from "react"
import { useFormSubmission } from "./use-form-submission"
import { useWellness } from "@/context/wellness-context"
import type { GoalFormData, GoalFormField } from "@/types/forms"

interface UseGoalFormOptions {
  onSuccess?: (data: GoalFormData) => void
}

export function useGoalForm(options: UseGoalFormOptions = {}) {
  const { categories, goals, updateGoals, updateCategory } = useWellness()

  // Initialize form data from current goals and categories
  const [formData, setFormData] = useState<GoalFormData>(() => {
    const initialGoals: GoalFormField[] = []
    const categorySettings: { id: string; enabled: boolean }[] = []

    categories.forEach((category) => {
      categorySettings.push({
        id: category.id,
        enabled: category.enabled,
      })

      category.metrics.forEach((metric) => {
        const goal = goals.find((g) => g.categoryId === category.id && g.metricId === metric.id)

        initialGoals.push({
          categoryId: category.id,
          metricId: metric.id,
          value: goal?.value || metric.defaultGoal,
          enabled: category.enabled,
        })
      })
    })

    return {
      goals: initialGoals,
      categorySettings,
    }
  })

  // Update form data when categories or goals change
  useEffect(() => {
    setFormData((prev) => {
      const updatedGoals = [...prev.goals]
      const updatedCategorySettings = [...prev.categorySettings]

      // Update category settings
      categories.forEach((category) => {
        const existingIndex = updatedCategorySettings.findIndex((c) => c.id === category.id)

        if (existingIndex >= 0) {
          updatedCategorySettings[existingIndex].enabled = category.enabled
        } else {
          updatedCategorySettings.push({
            id: category.id,
            enabled: category.enabled,
          })
        }
      })

      // Update goals
      goals.forEach((goal) => {
        const existingIndex = updatedGoals.findIndex(
          (g) => g.categoryId === goal.categoryId && g.metricId === goal.metricId,
        )

        if (existingIndex >= 0) {
          updatedGoals[existingIndex].value = goal.value
        }
      })

      return {
        goals: updatedGoals,
        categorySettings: updatedCategorySettings,
      }
    })
  }, [categories, goals])

  // Handle goal value changes
  const handleGoalChange = useCallback((categoryId: string, metricId: string, value: number) => {
    setFormData((prev) => {
      const goals = [...prev.goals]
      const existingIndex = goals.findIndex((g) => g.categoryId === categoryId && g.metricId === metricId)

      if (existingIndex >= 0) {
        goals[existingIndex] = {
          ...goals[existingIndex],
          value,
        }
      }

      return {
        ...prev,
        goals,
      }
    })
  }, [])

  // Handle category enabled changes
  const handleCategoryEnabledChange = useCallback((categoryId: string, enabled: boolean) => {
    setFormData((prev) => {
      // Update category settings
      const categorySettings = [...prev.categorySettings]
      const categoryIndex = categorySettings.findIndex((c) => c.id === categoryId)

      if (categoryIndex >= 0) {
        categorySettings[categoryIndex] = {
          ...categorySettings[categoryIndex],
          enabled,
        }
      }

      // Update enabled state for all goals in this category
      const goals = prev.goals.map((goal) => {
        if (goal.categoryId === categoryId) {
          return {
            ...goal,
            enabled,
          }
        }
        return goal
      })

      return {
        categorySettings,
        goals,
      }
    })
  }, [])

  // Form submission handler
  const formSubmission = useFormSubmission<GoalFormData>({
    onSubmit: async (data) => {
      try {
        // Update category enabled states
        data.categorySettings.forEach((categorySetting) => {
          const category = categories.find((c) => c.id === categorySetting.id)

          if (category && category.enabled !== categorySetting.enabled) {
            updateCategory(categorySetting.id, { enabled: categorySetting.enabled })
          }
        })

        // Update goals
        const updatedGoals = data.goals.map((goal) => ({
          categoryId: goal.categoryId,
          metricId: goal.metricId,
          value: goal.value,
        }))

        updateGoals(updatedGoals)

        return {
          success: true,
          data,
          message: "Goals updated successfully!",
        }
      } catch (error) {
        console.error("Error saving goals:", error)
        return {
          success: false,
          message: "Failed to save goals",
        }
      }
    },
    onSuccess: (result) => {
      // Call the onSuccess callback if provided
      if (options.onSuccess && result.data) {
        options.onSuccess(result.data)
      }
    },
  })

  return {
    formData,
    handleGoalChange,
    handleCategoryEnabledChange,
    setFormData,
    ...formSubmission,
  }
}

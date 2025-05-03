"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useWellness } from "@/context/wellness-context"
import { useStableDependencyCallback } from "@/lib/performance-utils"

/**
 * Hook to select a specific part of the wellness context
 * Only re-renders when the selected data changes
 */
export function useWellnessSelector<T>(
  selector: (context: ReturnType<typeof useWellness>) => T,
  dependencies: React.DependencyList = [],
): T {
  const context = useWellness()
  const [selectedValue, setSelectedValue] = useState<T>(() => selector(context))

  // Create a stable selector function
  const stableSelector = useStableDependencyCallback(selector, dependencies)

  // Store previous values for comparison
  const previousValueRef = useRef<T>(selectedValue)

  // Update selected value when context or selector changes
  useEffect(() => {
    const newValue = stableSelector(context)

    // Only update state if the value has changed (using deep comparison for objects)
    const hasChanged =
      typeof newValue === "object" && newValue !== null
        ? JSON.stringify(newValue) !== JSON.stringify(previousValueRef.current)
        : newValue !== previousValueRef.current

    if (hasChanged) {
      previousValueRef.current = newValue
      setSelectedValue(newValue)
    }
  }, [context, stableSelector])

  return selectedValue
}

/**
 * Hook to get a specific category by ID
 */
export function useCategoryById(categoryId: string) {
  return useWellnessSelector((context) => context.getCategoryById(categoryId), [categoryId])
}

/**
 * Hook to get goals for a specific category
 */
export function useCategoryGoals(categoryId: string) {
  return useWellnessSelector((context) => context.goals.filter((goal) => goal.categoryId === categoryId), [categoryId])
}

/**
 * Hook to get entries for a specific category
 */
export function useCategoryEntries(categoryId: string) {
  return useWellnessSelector(
    (context) => context.entries.filter((entry) => entry.metrics.some((metric) => metric.categoryId === categoryId)),
    [categoryId],
  )
}

"use client"

import { useCallback, useEffect, useRef } from "react"
import { useWellness } from "@/context/wellness-context"
import type { WellnessCategory, WellnessEntry } from "@/schemas/wellness-schemas"

// Custom hook for optimized wellness data access
export function useOptimizedWellness() {
  const wellness = useWellness()

  // Get normalized data from context
  const { categories, goals, entries, indexes } = wellness.getNormalizedData()

  // Cache reference for performance tracking
  const performanceMetrics = useRef<Record<string, number[]>>({})

  // Track render count for performance monitoring
  const renderCount = useRef(0)
  useEffect(() => {
    renderCount.current += 1
  })

  // Optimized category operations with performance tracking
  const getEnabledCategories = useCallback(() => {
    const start = performance.now()

    // Get all enabled categories using the index
    const result = Array.from(indexes.enabledCategoryIds)
      .map((id) => categories.byId[id])
      .filter(Boolean)

    const end = performance.now()

    // Record performance
    if (!performanceMetrics.current.getEnabledCategories) {
      performanceMetrics.current.getEnabledCategories = []
    }
    performanceMetrics.current.getEnabledCategories.push(end - start)

    return result
  }, [categories, indexes])

  // Optimized entry retrieval by date range
  const getEntriesByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      const start = performance.now()

      // Generate date keys for the range
      const dateKeys: string[] = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        dateKeys.push(currentDate.toISOString().split("T")[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Get entry IDs for each date and flatten
      const entryIds = new Set<string>()
      dateKeys.forEach((dateKey) => {
        const idsForDate = indexes.entriesByDate.get(dateKey) || []
        idsForDate.forEach((id) => entryIds.add(id))
      })

      // Map IDs to entries
      const result = Array.from(entryIds)
        .map((id) => entries.byId[id])
        .filter(Boolean)

      const end = performance.now()

      // Record performance
      if (!performanceMetrics.current.getEntriesByDateRange) {
        performanceMetrics.current.getEntriesByDateRange = []
      }
      performanceMetrics.current.getEntriesByDateRange.push(end - start)

      return result
    },
    [entries, indexes],
  )

  // Get metrics for a category
  const getMetricsForCategory = useCallback(
    (categoryId: string) => {
      const category = categories.byId[categoryId]
      return category?.metrics || []
    },
    [categories],
  )

  // Get goal value by category and metric
  const getGoalValue = useCallback(
    (categoryId: string, metricId: string): number | undefined => {
      const key = `${categoryId}:${metricId}`
      const goalId = indexes.goalByMetricId.get(key)

      if (goalId) {
        return goals.byId[goalId]?.value
      }

      // If no goal is found, look for the default goal in the category definition
      const category = categories.byId[categoryId]
      const metric = category?.metrics.find((m) => m.id === metricId)

      return metric?.defaultGoal
    },
    [categories, goals, indexes],
  )

  // Get entries by category
  const getEntriesByCategory = useCallback(
    (categoryId: string): WellnessEntry[] => {
      const entryIds = indexes.entriesByCategoryId.get(categoryId) || []
      return entryIds.map((id) => entries.byId[id]).filter(Boolean)
    },
    [entries, indexes],
  )

  // Get entries by metric
  const getEntriesByMetric = useCallback(
    (metricId: string): WellnessEntry[] => {
      const entryIds = indexes.entriesByMetricId.get(metricId) || []
      return entryIds.map((id) => entries.byId[id]).filter(Boolean)
    },
    [entries, indexes],
  )

  // Get category by name (case insensitive)
  const getCategoryByName = useCallback(
    (name: string): WellnessCategory | undefined => {
      const categoryId = indexes.categoryByName.get(name.toLowerCase())
      return categoryId ? categories.byId[categoryId] : undefined
    },
    [categories, indexes],
  )

  // Get performance metrics for analysis
  const getPerformanceMetrics = useCallback(() => {
    const metrics: Record<string, { avg: number; min: number; max: number; count: number }> = {}

    Object.entries(performanceMetrics.current).forEach(([key, values]) => {
      if (values.length === 0) return

      const sum = values.reduce((acc, val) => acc + val, 0)
      metrics[key] = {
        avg: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      }
    })

    return metrics
  }, [])

  // Clear performance metrics
  const clearPerformanceMetrics = useCallback(() => {
    performanceMetrics.current = {}
  }, [])

  return {
    // Original context functions
    ...wellness,

    // Optimized data structures
    normalizedData: { categories, goals, entries, indexes },

    // Optimized functions
    getEnabledCategories,
    getEntriesByDateRange,
    getMetricsForCategory,
    getGoalValue,
    getEntriesByCategory,
    getEntriesByMetric,
    getCategoryByName,

    // Performance monitoring
    getPerformanceMetrics,
    clearPerformanceMetrics,
    renderCount: () => renderCount.current,
  }
}

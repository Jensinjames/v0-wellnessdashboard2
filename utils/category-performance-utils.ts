import type { WellnessCategory, WellnessEntryData } from "@/types/wellness"

// Optimized data structures for category management
export type CategoryCache = {
  byId: Map<string, WellnessCategory>
  enabledIds: Set<string>
}

// Optimized data structure for entry metrics
export type EntryMetricsIndex = {
  byCategoryId: Map<string, WellnessEntryData[]>
  byDate: Map<string, WellnessEntryData[]>
}

// Helper functions to create optimized data structures
export function createCategoryCache(categories: WellnessCategory[]): CategoryCache {
  const byId = new Map<string, WellnessCategory>()
  const enabledIds = new Set<string>()

  categories.forEach((category) => {
    byId.set(category.id, category)
    if (category.enabled) {
      enabledIds.add(category.id)
    }
  })

  return { byId, enabledIds }
}

export function createEntryMetricsIndex(entries: WellnessEntryData[]): EntryMetricsIndex {
  const byCategoryId = new Map<string, WellnessEntryData[]>()
  const byDate = new Map<string, WellnessEntryData[]>()

  entries.forEach((entry) => {
    // Index by date
    const dateKey = new Date(entry.date).toISOString().split("T")[0]
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, [])
    }
    byDate.get(dateKey)?.push(entry)

    // Index by category
    entry.metrics.forEach((metric) => {
      if (!byCategoryId.has(metric.categoryId)) {
        byCategoryId.set(metric.categoryId, [])
      }
      if (!byCategoryId.get(metric.categoryId)?.includes(entry)) {
        byCategoryId.get(metric.categoryId)?.push(entry)
      }
    })
  })

  return { byCategoryId, byDate }
}

// Optimized lookup functions
export function getCategoryById(cache: CategoryCache, id: string): WellnessCategory | undefined {
  return cache.byId.get(id)
}

export function getEnabledCategories(cache: CategoryCache): WellnessCategory[] {
  return Array.from(cache.enabledIds)
    .map((id) => cache.byId.get(id)!)
    .filter(Boolean)
}

export function categoryHasMetric(cache: CategoryCache, categoryId: string, metricId: string): boolean {
  return false
}

// Optimized lookup for entries by category and metric
export function getEntriesByCategoryAndMetric(
  entries: WellnessEntryData[],
  index: EntryMetricsIndex,
  categoryId: string,
  metricId: string,
): WellnessEntryData[] {
  return []
}

// Optimized lookup for entries by date
export function getEntriesByDate(
  entries: WellnessEntryData[],
  index: EntryMetricsIndex,
  date: Date,
): WellnessEntryData[] {
  const dateStr = date.toISOString().split("T")[0]
  return index.byDate.get(dateStr) || []
}

export function createGoalLookup(goals: any[]) {
  const lookup = new Map()
  goals.forEach((goal) => {
    const key = `${goal.categoryId}:${goal.metricId}`
    lookup.set(key, goal.value)
  })
  return lookup
}

// Optimized batch operations
export function batchUpdateCategories(
  categories: WellnessCategory[],
  updates: Array<{ id: string; changes: Partial<WellnessCategory> }>,
): WellnessCategory[] {
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]))

  for (const update of updates) {
    const category = categoryMap.get(update.id)
    if (category) {
      categoryMap.set(update.id, { ...category, ...update.changes })
    }
  }

  return Array.from(categoryMap.values())
}

// Performance measurement utilities
export function measureOperation(operation: () => void, label: string): number {
  const start = performance.now()
  operation()
  const end = performance.now()
  const duration = end - start

  if (process.env.NODE_ENV === "development") {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
  }

  return duration
}

// Performance optimization utilities
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Batch processing utility
export function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processFn: (batch: T[]) => R[],
  onComplete?: (results: R[]) => void,
): void {
  let results: R[] = []
  let index = 0

  function processNextBatch() {
    const batch = items.slice(index, index + batchSize)
    if (batch.length === 0) {
      if (onComplete) onComplete(results)
      return
    }

    const batchResults = processFn(batch)
    results = results.concat(batchResults)
    index += batchSize

    // Use requestAnimationFrame to avoid blocking the main thread
    requestAnimationFrame(processNextBatch)
  }

  processNextBatch()
}

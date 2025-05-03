// Define the normalized store structure
export interface NormalizedStore<T extends { id: string }> {
  byId: Record<string, T>
  allIds: string[]
}

// Type aliases for specific stores
export type CategoriesStore = NormalizedStore<any>
export type GoalsStore = NormalizedStore<any>
export type EntriesStore = NormalizedStore<any>

// Interface for indexes to optimize lookups
export interface WellnessIndexes {
  // Category indexes
  categoryByName: Record<string, string> // name -> id
  enabledCategoryIds: Set<string>

  // Goal indexes
  goalsByCategoryId: Record<string, string[]> // categoryId -> goalIds[]
  goalByCategoryAndMetric: Record<string, Record<string, string>> // categoryId -> { metricId -> goalId }

  // Entry indexes
  entriesByCategoryId: Record<string, string[]> // categoryId -> entryIds[]
  entriesByDate: Record<string, string[]> // date (YYYY-MM-DD) -> entryIds[]
  recentEntryIds: string[] // most recent entries first
}

// Convert array to normalized store
export function arrayToNormalizedStore<T extends { id: string }>(array: T[]): NormalizedStore<T> {
  const byId: Record<string, T> = {}
  const allIds: string[] = []

  array.forEach((item) => {
    byId[item.id] = item
    allIds.push(item.id)
  })

  return { byId, allIds }
}

// Convert normalized store to array
export function normalizedStoreToArray<T extends { id: string }>(store: NormalizedStore<T>): T[] {
  return store.allIds.map((id) => store.byId[id])
}

// Add an item to a normalized store
export function addItem<T extends { id: string }>(store: NormalizedStore<T>, item: T): NormalizedStore<T> {
  return {
    byId: { ...store.byId, [item.id]: item },
    allIds: [...store.allIds, item.id],
  }
}

// Update an item in a normalized store
export function updateItem<T extends { id: string }>(
  store: NormalizedStore<T>,
  id: string,
  item: T,
): NormalizedStore<T> {
  return {
    byId: { ...store.byId, [id]: item },
    allIds: store.allIds,
  }
}

// Remove an item from a normalized store
export function removeItem<T extends { id: string }>(store: NormalizedStore<T>, id: string): NormalizedStore<T> {
  const { [id]: _, ...restById } = store.byId
  return {
    byId: restById,
    allIds: store.allIds.filter((itemId) => itemId !== id),
  }
}

// Reorder items in a normalized store
export function reorderItems<T extends { id: string }>(
  store: NormalizedStore<T>,
  startIndex: number,
  endIndex: number,
): NormalizedStore<T> {
  const result = { ...store }
  const [removed] = result.allIds.splice(startIndex, 1)
  result.allIds.splice(endIndex, 0, removed)
  return result
}

// Batch update items
export function batchUpdateItems<T extends { id: string }>(
  store: NormalizedStore<T>,
  updates: Array<{ id: string; changes: Partial<T> }>,
): NormalizedStore<T> {
  const newById = { ...store.byId }

  updates.forEach(({ id, changes }) => {
    if (newById[id]) {
      newById[id] = { ...newById[id], ...changes }
    }
  })

  return {
    byId: newById,
    allIds: store.allIds,
  }
}

// Build indexes for optimized lookups
export function buildIndexes(categories: CategoriesStore, goals: GoalsStore, entries: EntriesStore): WellnessIndexes {
  // Initialize indexes
  const indexes: WellnessIndexes = {
    categoryByName: {},
    enabledCategoryIds: new Set<string>(),
    goalsByCategoryId: {},
    goalByCategoryAndMetric: {},
    entriesByCategoryId: {},
    entriesByDate: {},
    recentEntryIds: [],
  }

  // Build category indexes
  Object.values(categories.byId).forEach((category) => {
    if (category.name) {
      indexes.categoryByName[category.name.toLowerCase()] = category.id
    }

    if (category.enabled !== false) {
      indexes.enabledCategoryIds.add(category.id)
    }
  })

  // Build goal indexes
  Object.values(goals.byId).forEach((goal) => {
    // Index by category ID
    if (!indexes.goalsByCategoryId[goal.categoryId]) {
      indexes.goalsByCategoryId[goal.categoryId] = []
    }
    indexes.goalsByCategoryId[goal.categoryId].push(goal.id)

    // Index by category and metric
    if (!indexes.goalByCategoryAndMetric[goal.categoryId]) {
      indexes.goalByCategoryAndMetric[goal.categoryId] = {}
    }
    indexes.goalByCategoryAndMetric[goal.categoryId][goal.metricId] = goal.id
  })

  // Build entry indexes
  const entriesWithDates: Array<{ id: string; date: Date }> = []

  Object.values(entries.byId).forEach((entry) => {
    // Index by category ID
    if (!indexes.entriesByCategoryId[entry.categoryId]) {
      indexes.entriesByCategoryId[entry.categoryId] = []
    }
    indexes.entriesByCategoryId[entry.categoryId].push(entry.id)

    // Index by date
    const date = new Date(entry.date)
    const dateString = date.toISOString().split("T")[0] // YYYY-MM-DD

    if (!indexes.entriesByDate[dateString]) {
      indexes.entriesByDate[dateString] = []
    }
    indexes.entriesByDate[dateString].push(entry.id)

    // Add to entries with dates for sorting
    entriesWithDates.push({ id: entry.id, date })
  })

  // Sort entries by date (most recent first) for recent entries index
  entriesWithDates.sort((a, b) => b.date.getTime() - a.date.getTime())
  indexes.recentEntryIds = entriesWithDates.map((entry) => entry.id)

  return indexes
}

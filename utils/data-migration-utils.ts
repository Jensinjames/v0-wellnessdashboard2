import type { WellnessCategory, WellnessGoal, WellnessEntry } from "@/schemas/wellness-schemas"
import {
  type CategoriesStore,
  type GoalsStore,
  type EntriesStore,
  arrayToNormalizedStore,
  normalizedStoreToArray,
} from "@/utils/normalized-store"

// Convert legacy data to normalized format
export function convertLegacyToNormalized(legacyData: {
  categories?: WellnessCategory[]
  goals?: WellnessGoal[]
  entries?: WellnessEntry[]
}) {
  const result = {
    categories: arrayToNormalizedStore<WellnessCategory>(legacyData.categories || []),
    goals: arrayToNormalizedStore<WellnessGoal>(legacyData.goals || []),
    entries: arrayToNormalizedStore<WellnessEntry>(legacyData.entries || []),
  }

  return result
}

// Convert normalized data to legacy format
export function convertNormalizedToLegacy(normalizedData: {
  categories: CategoriesStore
  goals: GoalsStore
  entries: EntriesStore
}) {
  return {
    categories: normalizedStoreToArray(normalizedData.categories),
    goals: normalizedStoreToArray(normalizedData.goals),
    entries: normalizedStoreToArray(normalizedData.entries),
  }
}

// Detect data format (normalized or legacy)
export function detectDataFormat(data: any): "normalized" | "legacy" | "unknown" {
  if (!data) return "unknown"

  // Check if it's normalized format
  if (data.categories && data.categories.byId && data.categories.allIds && Array.isArray(data.categories.allIds)) {
    return "normalized"
  }

  // Check if it's legacy format
  if (data.categories && Array.isArray(data.categories)) {
    return "legacy"
  }

  return "unknown"
}

// Migrate data from any format to normalized format
export function migrateToNormalized(data: any) {
  const format = detectDataFormat(data)

  switch (format) {
    case "normalized":
      return data
    case "legacy":
      return convertLegacyToNormalized(data)
    default:
      throw new Error("Unknown data format")
  }
}

import { toast } from "@/hooks/use-toast"
import {
  categoriesArraySchema,
  goalsArraySchema,
  entriesArraySchema,
  type WellnessCategory,
  type WellnessGoal,
  type WellnessEntry,
} from "@/schemas/wellness-schemas"
import { DEFAULT_CATEGORIES } from "@/types/wellness"
import {
  type NormalizedStore,
  type CategoriesStore,
  type GoalsStore,
  type EntriesStore,
  arrayToNormalizedStore,
  normalizedStoreToArray,
} from "@/utils/normalized-store"

// Storage keys
export const STORAGE_KEYS = {
  CATEGORIES: "wellness_categories",
  GOALS: "wellness_goals",
  ENTRIES: "wellness_entries",
  SETTINGS: "wellness_settings",
  USER_PREFERENCES: "wellness_user_preferences",
}

// Generic function to safely get items from localStorage with validation
export function safelyGetFromStorage<T>(
  key: string,
  schema: any,
  defaultValue: T[],
  notifyOnError = false,
): NormalizedStore<T> {
  try {
    // Get data from localStorage
    const storedData = localStorage.getItem(key)

    if (!storedData) {
      return arrayToNormalizedStore(defaultValue)
    }

    // Parse JSON
    const parsedData = JSON.parse(storedData)

    // Validate with schema
    const result = schema.safeParse(parsedData)

    if (result.success) {
      return arrayToNormalizedStore(result.data)
    } else {
      if (notifyOnError) {
        console.error(`Invalid data format for ${key}:`, result.error)
        toast({
          title: "Data Format Error",
          description: `Invalid data format in storage for ${key}. Using default values.`,
          variant: "destructive",
        })
      }
      return arrayToNormalizedStore(defaultValue)
    }
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)

    if (notifyOnError) {
      toast({
        title: "Storage Error",
        description: `Could not load data from storage for ${key}. Using default values.`,
        variant: "destructive",
      })
    }

    return arrayToNormalizedStore(defaultValue)
  }
}

// Generic function to safely set items in localStorage
export function safelySetInStorage<T>(key: string, store: NormalizedStore<T>, notifyOnError = false): boolean {
  try {
    // Convert to array
    const dataArray = normalizedStoreToArray(store)

    // Convert to JSON string
    const jsonData = JSON.stringify(dataArray)

    // Save to localStorage
    localStorage.setItem(key, jsonData)
    return true
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)

    if (notifyOnError) {
      toast({
        title: "Storage Error",
        description: `Failed to save data to storage for ${key}.`,
        variant: "destructive",
      })
    }

    return false
  }
}

// Specific functions for wellness data types
export function getCategories(): CategoriesStore {
  return safelyGetFromStorage<WellnessCategory>(STORAGE_KEYS.CATEGORIES, categoriesArraySchema, DEFAULT_CATEGORIES)
}

export function setCategories(categories: CategoriesStore): boolean {
  return safelySetInStorage<WellnessCategory>(STORAGE_KEYS.CATEGORIES, categories)
}

export function getGoals(): GoalsStore {
  return safelyGetFromStorage<WellnessGoal>(
    STORAGE_KEYS.GOALS,
    goalsArraySchema,
    [], // Default empty array
  )
}

export function setGoals(goals: GoalsStore): boolean {
  return safelySetInStorage<WellnessGoal>(STORAGE_KEYS.GOALS, goals)
}

export function getEntries(): EntriesStore {
  return safelyGetFromStorage<WellnessEntry>(
    STORAGE_KEYS.ENTRIES,
    entriesArraySchema,
    [], // Default empty array
  )
}

export function setEntries(entries: EntriesStore): boolean {
  return safelySetInStorage<WellnessEntry>(STORAGE_KEYS.ENTRIES, entries)
}

// Function to clear all wellness data (useful for testing or reset)
export function clearAllWellnessData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES)
    localStorage.removeItem(STORAGE_KEYS.GOALS)
    localStorage.removeItem(STORAGE_KEYS.ENTRIES)
    localStorage.removeItem(STORAGE_KEYS.SETTINGS)

    toast({
      title: "Data Reset",
      description: "All wellness data has been cleared successfully.",
    })
  } catch (error) {
    console.error("Error clearing wellness data:", error)

    toast({
      title: "Reset Error",
      description: "Failed to clear wellness data. Please try again.",
      variant: "destructive",
    })
  }
}

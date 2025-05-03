"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { DEFAULT_CATEGORIES } from "@/types/wellness"
import { generateUniqueId } from "@/utils/id-generator"
import type { WellnessCategory, WellnessGoal, WellnessEntry } from "@/schemas/wellness-schemas"
import { validateCategory, validateGoal, validateEntry, validateGoalsArray } from "@/utils/validation-utils"
import { getCategories, setCategories, getGoals, setGoals, getEntries, setEntries } from "@/utils/storage-utils"
import {
  type CategoriesStore,
  type GoalsStore,
  type EntriesStore,
  type WellnessIndexes,
  addItem,
  updateItem,
  removeItem,
  reorderItems,
  buildIndexes,
  arrayToNormalizedStore,
  normalizedStoreToArray,
} from "@/utils/normalized-store"

// Generate initial goals from default categories
const generateInitialGoals = (): WellnessGoal[] => {
  return DEFAULT_CATEGORIES.flatMap((category) =>
    category.metrics.map((metric) => ({
      categoryId: category.id,
      metricId: metric.id,
      value: metric.defaultGoal,
    })),
  )
}

// Define context type
interface WellnessContextType {
  // Data
  categories: WellnessCategory[]
  goals: WellnessGoal[]
  entries: WellnessEntry[]
  isLoading: boolean

  // Category operations
  addCategory: (
    category: Omit<WellnessCategory, "id">,
  ) => Promise<{ success: boolean; message?: string; data?: WellnessCategory }>
  updateCategory: (
    categoryId: string,
    updates: Partial<WellnessCategory>,
  ) => Promise<{ success: boolean; message?: string; data?: WellnessCategory }>
  removeCategory: (categoryId: string) => Promise<{ success: boolean; message?: string }>
  getCategoryById: (categoryId: string) => WellnessCategory | undefined
  reorderCategories: (startIndex: number, endIndex: number) => Promise<{ success: boolean; message?: string }>

  // Goal operations
  setGoal: (goal: WellnessGoal) => Promise<{ success: boolean; message?: string; data?: WellnessGoal }>
  updateGoals: (goals: WellnessGoal[]) => Promise<{ success: boolean; message?: string }>
  getGoalByCategoryAndMetric: (categoryId: string, metricId: string) => number | undefined

  // Entry operations
  addEntry: (entry: Omit<WellnessEntry, "id">) => Promise<{ success: boolean; message?: string; data?: WellnessEntry }>
  updateEntry: (
    entryId: string,
    updates: Partial<WellnessEntry>,
  ) => Promise<{ success: boolean; message?: string; data?: WellnessEntry }>
  removeEntry: (entryId: string) => Promise<{ success: boolean; message?: string }>

  // Helper functions
  categoryIdExists: (id: string) => boolean
  metricIdExistsInCategory: (categoryId: string, metricId: string) => boolean

  // Advanced data access (for optimized components)
  getNormalizedData: () => {
    categories: CategoriesStore
    goals: GoalsStore
    entries: EntriesStore
    indexes: WellnessIndexes
  }
}

// Create context
const WellnessContext = createContext<WellnessContextType | undefined>(undefined)

// Provider component
export function WellnessProvider({ children }: { children: React.ReactNode }) {
  // Normalized state
  const [categoriesStore, setCategoriesStore] = useState<CategoriesStore>(() => arrayToNormalizedStore([]))
  const [goalsStore, setGoalsStore] = useState<GoalsStore>(() => arrayToNormalizedStore([]))
  const [entriesStore, setEntriesStore] = useState<EntriesStore>(() => arrayToNormalizedStore([]))
  const [isLoading, setIsLoading] = useState(true)

  // Build indexes whenever data changes
  const indexes = useMemo<WellnessIndexes>(
    () => buildIndexes(categoriesStore, goalsStore, entriesStore),
    [categoriesStore, goalsStore, entriesStore],
  )

  // Denormalized data for backward compatibility
  const categories = useMemo(() => normalizedStoreToArray(categoriesStore), [categoriesStore])
  const goals = useMemo(() => normalizedStoreToArray(goalsStore), [goalsStore])
  const entries = useMemo(() => normalizedStoreToArray(entriesStore), [entriesStore])

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      setIsLoading(true)

      // Get data from localStorage with validation
      const storedCategories = getCategories()
      const storedGoals = getGoals()
      const storedEntries = getEntries()

      // Populate state
      setCategoriesStore(storedCategories)

      // If we have no goals but have categories, generate initial goals
      if (Object.keys(storedGoals.byId).length === 0 && Object.keys(storedCategories.byId).length > 0) {
        const initialGoals = generateInitialGoals()
        setGoalsStore(arrayToNormalizedStore(initialGoals))
      } else {
        setGoalsStore(storedGoals)
      }

      setEntriesStore(storedEntries)
    } catch (error) {
      console.error("Error loading wellness data:", error)
      toast({
        title: "Data Loading Error",
        description: "Failed to load wellness data. Using default values.",
        variant: "destructive",
      })

      // Set default values
      setCategoriesStore(arrayToNormalizedStore(DEFAULT_CATEGORIES))
      setGoalsStore(arrayToNormalizedStore(generateInitialGoals()))
      setEntriesStore(arrayToNormalizedStore([]))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && categoriesStore.allIds.length > 0) {
      setCategories(categoriesStore)
    }
  }, [categoriesStore, isLoading])

  // Save goals to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && goalsStore.allIds.length > 0) {
      setGoals(goalsStore)
    }
  }, [goalsStore, isLoading])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      setEntries(entriesStore)
    }
  }, [entriesStore, isLoading])

  // Category helper functions
  const categoryIdExists = useCallback(
    (id: string): boolean => {
      return id in categoriesStore.byId
    },
    [categoriesStore],
  )

  const metricIdExistsInCategory = useCallback(
    (categoryId: string, metricId: string): boolean => {
      const category = categoriesStore.byId[categoryId]
      return category ? category.metrics.some((metric) => metric.id === metricId) : false
    },
    [categoriesStore],
  )

  const getCategoryById = useCallback(
    (categoryId: string) => {
      return categoriesStore.byId[categoryId]
    },
    [categoriesStore],
  )

  // Add a new category with validation
  const addCategory = useCallback(
    async (
      categoryData: Omit<WellnessCategory, "id">,
    ): Promise<{ success: boolean; message?: string; data?: WellnessCategory }> => {
      try {
        // Generate a unique ID
        const id = generateUniqueId()

        // Create the new category
        const newCategory: WellnessCategory = {
          id,
          ...categoryData,
        }

        // Validate the new category
        const validationResult = validateCategory(newCategory)

        if (!validationResult.success) {
          return {
            success: false,
            message: `Invalid category data: ${validationResult.errorMessages?.join(", ")}`,
          }
        }

        // Add to state
        setCategoriesStore((prev) => addItem(prev, validationResult.data!))

        return {
          success: true,
          data: validationResult.data,
        }
      } catch (error) {
        console.error("Error adding category:", error)
        return {
          success: false,
          message: "An unexpected error occurred while adding the category.",
        }
      }
    },
    [],
  )

  // Update an existing category with validation
  const updateCategory = useCallback(
    async (
      categoryId: string,
      updates: Partial<WellnessCategory>,
    ): Promise<{ success: boolean; message?: string; data?: WellnessCategory }> => {
      try {
        // Find the category
        const existingCategory = categoriesStore.byId[categoryId]

        if (!existingCategory) {
          return {
            success: false,
            message: `Category with ID ${categoryId} not found.`,
          }
        }

        // Create the updated category
        const updatedCategory: WellnessCategory = {
          ...existingCategory,
          ...updates,
        }

        // Validate the updated category
        const validationResult = validateCategory(updatedCategory)

        if (!validationResult.success) {
          return {
            success: false,
            message: `Invalid category data: ${validationResult.errorMessages?.join(", ")}`,
          }
        }

        // Update state
        setCategoriesStore((prev) => updateItem(prev, categoryId, validationResult.data!))

        return {
          success: true,
          data: validationResult.data,
        }
      } catch (error) {
        console.error("Error updating category:", error)
        return {
          success: false,
          message: "An unexpected error occurred while updating the category.",
        }
      }
    },
    [categoriesStore],
  )

  // Remove a category with validation
  const removeCategory = useCallback(
    async (categoryId: string): Promise<{ success: boolean; message?: string }> => {
      try {
        // Check if category exists
        const existingCategory = categoriesStore.byId[categoryId]

        if (!existingCategory) {
          return {
            success: false,
            message: `Category with ID ${categoryId} not found.`,
          }
        }

        // Remove category from state
        setCategoriesStore((prev) => removeItem(prev, categoryId))

        // Remove related goals
        setGoalsStore((prev) => {
          let updated = { ...prev }

          // Find goals related to this category
          const goalIdsToRemove = Object.values(prev.byId)
            .filter((goal) => goal.categoryId === categoryId)
            .map((goal) => goal.id)

          // Remove each goal
          goalIdsToRemove.forEach((goalId) => {
            updated = removeItem(updated, goalId)
          })

          return updated
        })

        return { success: true }
      } catch (error) {
        console.error("Error removing category:", error)
        return {
          success: false,
          message: "An unexpected error occurred while removing the category.",
        }
      }
    },
    [categoriesStore],
  )

  // Reorder categories
  const reorderCategories = useCallback(
    async (startIndex: number, endIndex: number): Promise<{ success: boolean; message?: string }> => {
      try {
        if (
          startIndex < 0 ||
          endIndex < 0 ||
          startIndex >= categoriesStore.allIds.length ||
          endIndex >= categoriesStore.allIds.length
        ) {
          return {
            success: false,
            message: "Invalid index for reordering categories.",
          }
        }

        setCategoriesStore((prev) => reorderItems(prev, startIndex, endIndex))

        return { success: true }
      } catch (error) {
        console.error("Error reordering categories:", error)
        return {
          success: false,
          message: "An unexpected error occurred while reordering categories.",
        }
      }
    },
    [categoriesStore],
  )

  // Goal management functions
  const setGoal = useCallback(
    async (goal: WellnessGoal): Promise<{ success: boolean; message?: string; data?: WellnessGoal }> => {
      try {
        // Validate the goal
        const validationResult = validateGoal(goal)

        if (!validationResult.success) {
          return {
            success: false,
            message: `Invalid goal data: ${validationResult.errorMessages?.join(", ")}`,
          }
        }

        // Check if category and metric exist
        if (!categoryIdExists(goal.categoryId)) {
          return {
            success: false,
            message: `Category with ID ${goal.categoryId} does not exist.`,
          }
        }

        if (!metricIdExistsInCategory(goal.categoryId, goal.metricId)) {
          return {
            success: false,
            message: `Metric with ID ${goal.metricId} does not exist in category ${goal.categoryId}.`,
          }
        }

        // Find existing goal with same category and metric
        const existingGoalId = Object.values(goalsStore.byId).find(
          (g) => g.categoryId === goal.categoryId && g.metricId === goal.metricId,
        )?.id

        if (existingGoalId) {
          // Update existing goal
          setGoalsStore((prev) => updateItem(prev, existingGoalId, validationResult.data!))
        } else {
          // Add new goal with ID if it doesn't have one
          const goalWithId = goal.id ? goal : { ...goal, id: generateUniqueId() }
          setGoalsStore((prev) => addItem(prev, goalWithId))
        }

        return {
          success: true,
          data: validationResult.data,
        }
      } catch (error) {
        console.error("Error setting goal:", error)
        return {
          success: false,
          message: "An unexpected error occurred while setting the goal.",
        }
      }
    },
    [categoryIdExists, metricIdExistsInCategory],
  )

  const updateGoals = useCallback(async (newGoals: WellnessGoal[]): Promise<{ success: boolean; message?: string }> => {
    try {
      // Validate the goals
      const validationResult = validateGoalsArray(newGoals)

      if (!validationResult.success) {
        return {
          success: false,
          message: `Invalid goals data: ${validationResult.errorMessages?.join(", ")}`,
        }
      }

      // Update goals
      setGoalsStore((prev) => {
        let updated = { ...prev }

        validationResult.data!.forEach((newGoal) => {
          // Find existing goal with same category and metric
          const existingGoalId = Object.values(prev.byId).find(
            (g) => g.categoryId === newGoal.categoryId && g.metricId === newGoal.metricId,
          )?.id

          if (existingGoalId) {
            // Update existing goal
            updated = updateItem(updated, existingGoalId, newGoal)
          } else {
            // Add new goal with ID if it doesn't have one
            const goalWithId = newGoal.id ? newGoal : { ...newGoal, id: generateUniqueId() }
            updated = addItem(updated, goalWithId)
          }
        })

        return updated
      })

      return { success: true }
    } catch (error) {
      console.error("Error updating goals:", error)
      return {
        success: false,
        message: "An unexpected error occurred while updating goals.",
      }
    }
  }, [])

  const getGoalByCategoryAndMetric = useCallback(
    (categoryId: string, metricId: string) => {
      // Find goal with matching category and metric
      const goal = Object.values(goalsStore.byId).find((g) => g.categoryId === categoryId && g.metricId === metricId)

      if (goal) {
        return goal.value
      }

      // If no goal is found, look for the default goal in the category definition
      const category = categoriesStore.byId[categoryId]
      const metric = category?.metrics.find((m) => m.id === metricId)

      return metric?.defaultGoal
    },
    [categoriesStore, goalsStore],
  )

  // Entry management functions
  const addEntry = useCallback(
    async (
      entryData: Omit<WellnessEntry, "id">,
    ): Promise<{ success: boolean; message?: string; data?: WellnessEntry }> => {
      try {
        // Generate a unique ID
        const id = generateUniqueId()

        // Ensure date is a Date object
        const date = entryData.date instanceof Date ? entryData.date : new Date(entryData.date)

        // Create the new entry
        const newEntry: WellnessEntry = {
          id,
          ...entryData,
          date,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Validate the new entry
        const validationResult = validateEntry(newEntry)

        if (!validationResult.success) {
          return {
            success: false,
            message: `Invalid entry data: ${validationResult.errorMessages?.join(", ")}`,
          }
        }

        // Add to state
        setEntriesStore((prev) => addItem(prev, validationResult.data!))

        return {
          success: true,
          data: validationResult.data,
        }
      } catch (error) {
        console.error("Error adding entry:", error)
        return {
          success: false,
          message: "An unexpected error occurred while adding the entry.",
        }
      }
    },
    [],
  )

  const updateEntry = useCallback(
    async (
      entryId: string,
      updates: Partial<WellnessEntry>,
    ): Promise<{ success: boolean; message?: string; data?: WellnessEntry }> => {
      try {
        // Find the entry
        const existingEntry = entriesStore.byId[entryId]

        if (!existingEntry) {
          return {
            success: false,
            message: `Entry with ID ${entryId} not found.`,
          }
        }

        // Create the updated entry
        const updatedEntry: WellnessEntry = {
          ...existingEntry,
          ...updates,
          updatedAt: new Date(),
        }

        // Validate the updated entry
        const validationResult = validateEntry(updatedEntry)

        if (!validationResult.success) {
          return {
            success: false,
            message: `Invalid entry data: ${validationResult.errorMessages?.join(", ")}`,
          }
        }

        // Update state
        setEntriesStore((prev) => updateItem(prev, entryId, validationResult.data!))

        return {
          success: true,
          data: validationResult.data,
        }
      } catch (error) {
        console.error("Error updating entry:", error)
        return {
          success: false,
          message: "An unexpected error occurred while updating the entry.",
        }
      }
    },
    [entriesStore],
  )

  const removeEntry = useCallback(
    async (entryId: string): Promise<{ success: boolean; message?: string }> => {
      try {
        // Check if entry exists
        const existingEntry = entriesStore.byId[entryId]

        if (!existingEntry) {
          return {
            success: false,
            message: `Entry with ID ${entryId} not found.`,
          }
        }

        // Remove entry from state
        setEntriesStore((prev) => removeItem(prev, entryId))

        return { success: true }
      } catch (error) {
        console.error("Error removing entry:", error)
        return {
          success: false,
          message: "An unexpected error occurred while removing the entry.",
        }
      }
    },
    [entriesStore],
  )

  // Provide access to normalized data for optimized components
  const getNormalizedData = useCallback(() => {
    return {
      categories: categoriesStore,
      goals: goalsStore,
      entries: entriesStore,
      indexes,
    }
  }, [categoriesStore, goalsStore, entriesStore, indexes])

  // Context value
  const contextValue: WellnessContextType = {
    // Denormalized data for backward compatibility
    categories,
    goals,
    entries,
    isLoading,

    // Category operations
    addCategory,
    updateCategory,
    removeCategory,
    getCategoryById,
    reorderCategories,

    // Goal operations
    setGoal,
    updateGoals,
    getGoalByCategoryAndMetric,

    // Entry operations
    addEntry,
    updateEntry,
    removeEntry,

    // Helper functions
    categoryIdExists,
    metricIdExistsInCategory,

    // Advanced data access
    getNormalizedData,
  }

  return <WellnessContext.Provider value={contextValue}>{children}</WellnessContext.Provider>
}

// Custom hook to use the wellness context
export function useWellness() {
  const context = useContext(WellnessContext)

  if (context === undefined) {
    throw new Error("useWellness must be used within a WellnessProvider")
  }

  return context
}

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
import { useOptimisticUpdatesContext } from "@/context/optimistic-updates-context"

// Generate initial goals from default categories
const generateInitialGoals = (): WellnessGoal[] => {
  return DEFAULT_CATEGORIES.flatMap((category) =>
    category.metrics.map((metric) => ({
      id: `goal_${category.id}_${metric.id}`,
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

  // Optimistic UI helpers
  isPendingCategory: (id: string) => boolean
  isPendingGoal: (id: string) => boolean
  isPendingEntry: (id: string) => boolean
}

// Create context
const WellnessContext = createContext<WellnessContextType | undefined>(undefined)

// Provider component
export function WellnessProvider({ children }: { children: React.ReactNode }) {
  // Get optimistic updates context
  const { isPending, optimisticCreate, optimisticUpdate, optimisticDelete, optimisticBatch } =
    useOptimisticUpdatesContext()

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

  // Add a new category with optimistic updates
  const addCategory = useCallback(
    async (
      categoryData: Omit<WellnessCategory, "id">,
    ): Promise<{ success: boolean; message?: string; data?: WellnessCategory }> => {
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

      // Use optimistic update
      const result = await optimisticCreate<WellnessCategory>("category", validationResult.data!, async (data) => {
        // Optimistically update the UI
        setCategoriesStore((prev) => addItem(prev, data as WellnessCategory))

        // Simulate network delay (remove in production)
        await new Promise((resolve) => setTimeout(resolve, 500))

        return { success: true, data }
      })

      return result ? { success: true, data: result } : { success: false, message: "Failed to add category" }
    },
    [optimisticCreate],
  )

  // Update an existing category with optimistic updates
  const updateCategory = useCallback(
    async (
      categoryId: string,
      updates: Partial<WellnessCategory>,
    ): Promise<{ success: boolean; message?: string; data?: WellnessCategory }> => {
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

      // Use optimistic update
      const result = await optimisticUpdate<WellnessCategory>(
        "category",
        categoryId,
        validationResult.data!,
        async (id, data) => {
          // Optimistically update the UI
          setCategoriesStore((prev) => updateItem(prev, id, data as WellnessCategory))

          // Simulate network delay (remove in production)
          await new Promise((resolve) => setTimeout(resolve, 500))

          return { success: true, data }
        },
        existingCategory, // Rollback data
      )

      return result ? { success: true, data: result } : { success: false, message: "Failed to update category" }
    },
    [categoriesStore, optimisticUpdate],
  )

  // Remove a category with optimistic updates
  const removeCategory = useCallback(
    async (categoryId: string): Promise<{ success: boolean; message?: string }> => {
      // Check if category exists
      const existingCategory = categoriesStore.byId[categoryId]

      if (!existingCategory) {
        return {
          success: false,
          message: `Category with ID ${categoryId} not found.`,
        }
      }

      // Find goals related to this category
      const relatedGoals = Object.values(goalsStore.byId).filter((goal) => goal.categoryId === categoryId)

      // Use optimistic delete
      const success = await optimisticDelete<WellnessCategory>(
        "category",
        categoryId,
        async (id) => {
          // Optimistically update the UI
          setCategoriesStore((prev) => removeItem(prev, id))

          // Also remove related goals
          setGoalsStore((prev) => {
            let updated = { ...prev }
            relatedGoals.forEach((goal) => {
              updated = removeItem(updated, goal.id)
            })
            return updated
          })

          // Simulate network delay (remove in production)
          await new Promise((resolve) => setTimeout(resolve, 500))

          return { success: true }
        },
        existingCategory, // Rollback data
      )

      return { success }
    },
    [categoriesStore, goalsStore, optimisticDelete],
  )

  // Reorder categories with optimistic updates
  const reorderCategories = useCallback(
    async (startIndex: number, endIndex: number): Promise<{ success: boolean; message?: string }> => {
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

      // Store original order for rollback
      const originalOrder = [...categoriesStore.allIds]

      // Use optimistic batch
      const result = await optimisticBatch<{ success: boolean }>(
        "category",
        [{ type: "update", data: { startIndex, endIndex } }],
        async () => {
          // Optimistically update the UI
          setCategoriesStore((prev) => reorderItems(prev, startIndex, endIndex))

          // Simulate network delay (remove in production)
          await new Promise((resolve) => setTimeout(resolve, 500))

          return { success: true }
        },
      )

      return result ? { success: true } : { success: false, message: "Failed to reorder categories" }
    },
    [categoriesStore, optimisticBatch],
  )

  // Goal management functions with optimistic updates
  const setGoal = useCallback(
    async (goal: WellnessGoal): Promise<{ success: boolean; message?: string; data?: WellnessGoal }> => {
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
        // Update existing goal with optimistic update
        const result = await optimisticUpdate<WellnessGoal>(
          "goal",
          existingGoalId,
          validationResult.data!,
          async (id, data) => {
            // Optimistically update the UI
            setGoalsStore((prev) => updateItem(prev, id, data as WellnessGoal))

            // Simulate network delay (remove in production)
            await new Promise((resolve) => setTimeout(resolve, 500))

            return { success: true, data }
          },
          goalsStore.byId[existingGoalId], // Rollback data
        )

        return result ? { success: true, data: result } : { success: false, message: "Failed to update goal" }
      } else {
        // Add new goal with optimistic create
        const goalWithId = goal.id ? goal : { ...goal, id: generateUniqueId() }

        const result = await optimisticCreate<WellnessGoal>("goal", goalWithId, async (data) => {
          // Optimistically update the UI
          setGoalsStore((prev) => addItem(prev, data as WellnessGoal))

          // Simulate network delay (remove in production)
          await new Promise((resolve) => setTimeout(resolve, 500))

          return { success: true, data }
        })

        return result ? { success: true, data: result } : { success: false, message: "Failed to add goal" }
      }
    },
    [categoryIdExists, metricIdExistsInCategory, goalsStore, optimisticUpdate, optimisticCreate],
  )

  const updateGoals = useCallback(
    async (newGoals: WellnessGoal[]): Promise<{ success: boolean; message?: string }> => {
      // Validate the goals
      const validationResult = validateGoalsArray(newGoals)

      if (!validationResult.success) {
        return {
          success: false,
          message: `Invalid goals data: ${validationResult.errorMessages?.join(", ")}`,
        }
      }

      // Use optimistic batch
      const result = await optimisticBatch<{ success: boolean }>(
        "goal",
        newGoals.map((goal) => ({
          type: "update",
          id: goal.id,
          data: goal,
          rollbackData: goalsStore.byId[goal.id],
        })),
        async () => {
          // Optimistically update the UI
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

          // Simulate network delay (remove in production)
          await new Promise((resolve) => setTimeout(resolve, 500))

          return { success: true }
        },
      )

      return result ? { success: true } : { success: false, message: "Failed to update goals" }
    },
    [goalsStore, optimisticBatch],
  )

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

  // Entry management functions with optimistic updates
  const addEntry = useCallback(
    async (
      entryData: Omit<WellnessEntry, "id">,
    ): Promise<{ success: boolean; message?: string; data?: WellnessEntry }> => {
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

      // Use optimistic create
      const result = await optimisticCreate<WellnessEntry>("entry", validationResult.data!, async (data) => {
        // Optimistically update the UI
        setEntriesStore((prev) => addItem(prev, data as WellnessEntry))

        // Simulate network delay (remove in production)
        await new Promise((resolve) => setTimeout(resolve, 500))

        return { success: true, data }
      })

      return result ? { success: true, data: result } : { success: false, message: "Failed to add entry" }
    },
    [optimisticCreate],
  )

  const updateEntry = useCallback(
    async (
      entryId: string,
      updates: Partial<WellnessEntry>,
    ): Promise<{ success: boolean; message?: string; data?: WellnessEntry }> => {
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

      // Use optimistic update
      const result = await optimisticUpdate<WellnessEntry>(
        "entry",
        entryId,
        validationResult.data!,
        async (id, data) => {
          // Optimistically update the UI
          setEntriesStore((prev) => updateItem(prev, id, data as WellnessEntry))

          // Simulate network delay (remove in production)
          await new Promise((resolve) => setTimeout(resolve, 500))

          return { success: true, data }
        },
        existingEntry, // Rollback data
      )

      return result ? { success: true, data: result } : { success: false, message: "Failed to update entry" }
    },
    [entriesStore, optimisticUpdate],
  )

  const removeEntry = useCallback(
    async (entryId: string): Promise<{ success: boolean; message?: string }> => {
      // Check if entry exists
      const existingEntry = entriesStore.byId[entryId]

      if (!existingEntry) {
        return {
          success: false,
          message: `Entry with ID ${entryId} not found.`,
        }
      }

      // Use optimistic delete
      const success = await optimisticDelete<WellnessEntry>(
        "entry",
        entryId,
        async (id) => {
          // Optimistically update the UI
          setEntriesStore((prev) => removeItem(prev, id))

          // Simulate network delay (remove in production)
          await new Promise((resolve) => setTimeout(resolve, 500))

          return { success: true }
        },
        existingEntry, // Rollback data
      )

      return { success }
    },
    [entriesStore, optimisticDelete],
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

  // Optimistic UI helpers
  const isPendingCategory = useCallback((id: string) => isPending(id), [isPending])
  const isPendingGoal = useCallback((id: string) => isPending(id), [isPending])
  const isPendingEntry = useCallback((id: string) => isPending(id), [isPending])

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

    // Optimistic UI helpers
    isPendingCategory,
    isPendingGoal,
    isPendingEntry,
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

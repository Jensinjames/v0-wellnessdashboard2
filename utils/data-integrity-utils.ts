import { toast } from "@/hooks/use-toast"
import type { WellnessGoal, WellnessEntry } from "@/schemas/wellness-schemas"
import { validateCategoriesArray, validateGoalsArray, validateEntriesArray } from "@/utils/validation-utils"
import { getCategories, getGoals, setGoals, getEntries, setEntries } from "@/utils/storage-utils"

// Interface for data integrity check result
export interface IntegrityCheckResult {
  isValid: boolean
  missingCategoryReferences: { goalId?: string; entryId: string; categoryId: string }[]
  missingMetricReferences: { goalId?: string; entryId: string; categoryId: string; metricId: string }[]
  duplicateGoals: { categoryId: string; metricId: string; count: number }[]
  orphanedEntries: { entryId: string }[]
  recommendations: string[]
}

// Check data integrity across all entities
export function checkDataIntegrity(): IntegrityCheckResult {
  // Load data
  const categories = getCategories()
  const goals = getGoals()
  const entries = getEntries()

  // Validate schemas
  const categoriesValidation = validateCategoriesArray(categories)
  const goalsValidation = validateGoalsArray(goals)
  const entriesValidation = validateEntriesArray(entries)

  const isSchemaValid = categoriesValidation.success && goalsValidation.success && entriesValidation.success

  // Initialize result
  const result: IntegrityCheckResult = {
    isValid: isSchemaValid,
    missingCategoryReferences: [],
    missingMetricReferences: [],
    duplicateGoals: [],
    orphanedEntries: [],
    recommendations: [],
  }

  // If schemas are invalid, add recommendations
  if (!isSchemaValid) {
    if (!categoriesValidation.success) {
      result.recommendations.push(
        "Fix invalid category data: " + (categoriesValidation.errorMessages?.join("; ") || "Unknown validation error"),
      )
    }

    if (!goalsValidation.success) {
      result.recommendations.push(
        "Fix invalid goal data: " + (goalsValidation.errorMessages?.join("; ") || "Unknown validation error"),
      )
    }

    if (!entriesValidation.success) {
      result.recommendations.push(
        "Fix invalid entry data: " + (entriesValidation.errorMessages?.join("; ") || "Unknown validation error"),
      )
    }

    // Return early if schemas are invalid
    return result
  }

  // Create sets of category and metric IDs for efficient lookup
  const categoryIds = new Set(categories.map((c) => c.id))
  const metricIdsByCategoryId = new Map<string, Set<string>>()

  categories.forEach((category) => {
    metricIdsByCategoryId.set(category.id, new Set(category.metrics.map((m) => m.id)))
  })

  // Check goal references
  const goalKeys = new Set<string>()
  const duplicateGoalCounts: Record<string, number> = {}

  goals.forEach((goal) => {
    const goalKey = `${goal.categoryId}:${goal.metricId}`

    // Check for duplicate goals
    if (goalKeys.has(goalKey)) {
      duplicateGoalCounts[goalKey] = (duplicateGoalCounts[goalKey] || 1) + 1
    } else {
      goalKeys.add(goalKey)
    }

    // Check category reference
    if (!categoryIds.has(goal.categoryId)) {
      result.missingCategoryReferences.push({
        goalId: goalKey,
        categoryId: goal.categoryId,
        entryId: "",
      })
    }
    // Check metric reference if category exists
    else if (!metricIdsByCategoryId.get(goal.categoryId)?.has(goal.metricId)) {
      result.missingMetricReferences.push({
        goalId: goalKey,
        categoryId: goal.categoryId,
        metricId: goal.metricId,
        entryId: "",
      })
    }
  })

  // Process duplicate goals
  Object.entries(duplicateGoalCounts).forEach(([key, count]) => {
    const [categoryId, metricId] = key.split(":")
    result.duplicateGoals.push({
      categoryId,
      metricId,
      count,
    })
  })

  // Check entry references
  entries.forEach((entry) => {
    let hasValidMetrics = false

    entry.metrics.forEach((metric) => {
      // Check category reference
      if (!categoryIds.has(metric.categoryId)) {
        result.missingCategoryReferences.push({
          entryId: entry.id,
          categoryId: metric.categoryId,
        })
      }
      // Check metric reference if category exists
      else if (!metricIdsByCategoryId.get(metric.categoryId)?.has(metric.metricId)) {
        result.missingMetricReferences.push({
          entryId: entry.id,
          categoryId: metric.categoryId,
          metricId: metric.metricId,
        })
      } else {
        // At least one valid metric
        hasValidMetrics = true
      }
    })

    // If no valid metrics, mark as orphaned
    if (!hasValidMetrics && entry.metrics.length > 0) {
      result.orphanedEntries.push({
        entryId: entry.id,
      })
    }
  })

  // Set overall validity
  result.isValid =
    result.isValid &&
    result.missingCategoryReferences.length === 0 &&
    result.missingMetricReferences.length === 0 &&
    result.duplicateGoals.length === 0 &&
    result.orphanedEntries.length === 0

  // Generate recommendations
  if (result.missingCategoryReferences.length > 0) {
    result.recommendations.push(`Fix ${result.missingCategoryReferences.length} references to non-existent categories`)
  }

  if (result.missingMetricReferences.length > 0) {
    result.recommendations.push(`Fix ${result.missingMetricReferences.length} references to non-existent metrics`)
  }

  if (result.duplicateGoals.length > 0) {
    result.recommendations.push(`Resolve ${result.duplicateGoals.length} duplicate goal definitions`)
  }

  if (result.orphanedEntries.length > 0) {
    result.recommendations.push(`Clean up ${result.orphanedEntries.length} entries with no valid metrics`)
  }

  return result
}

// Fix common data integrity issues
export function fixDataIntegrityIssues(autoFix = false): {
  fixed: boolean
  message: string
} {
  // Check integrity first
  const integrityCheck = checkDataIntegrity()

  if (integrityCheck.isValid) {
    return {
      fixed: true,
      message: "No data integrity issues found.",
    }
  }

  if (!autoFix) {
    return {
      fixed: false,
      message: `Found ${integrityCheck.recommendations.length} data integrity issues. Enable autoFix to resolve automatically.`,
    }
  }

  try {
    // Load data
    const categories = getCategories()
    const goals = getGoals()
    const entries = getEntries()

    // Fix duplicate goals
    if (integrityCheck.duplicateGoals.length > 0) {
      // Create a map to track which goals we've already seen
      const seenGoals = new Map<string, WellnessGoal>()
      const uniqueGoals: WellnessGoal[] = []

      goals.forEach((goal) => {
        const key = `${goal.categoryId}:${goal.metricId}`

        if (!seenGoals.has(key)) {
          seenGoals.set(key, goal)
          uniqueGoals.push(goal)
        }
      })

      // Save deduplicated goals
      setGoals(uniqueGoals)
    }

    // Fix missing references in entries
    if (
      integrityCheck.missingCategoryReferences.length > 0 ||
      integrityCheck.missingMetricReferences.length > 0 ||
      integrityCheck.orphanedEntries.length > 0
    ) {
      // Create sets of problematic entry IDs
      const problemEntryIds = new Set(
        [
          ...integrityCheck.missingCategoryReferences.map((ref) => ref.entryId),
          ...integrityCheck.missingMetricReferences.map((ref) => ref.entryId),
          ...integrityCheck.orphanedEntries.map((ref) => ref.entryId),
        ].filter(Boolean),
      )

      // Filter out problematic entries or fix their metrics
      const fixedEntries: WellnessEntry[] = entries
        .map((entry) => {
          if (problemEntryIds.has(entry.id)) {
            // Filter out invalid metrics
            const validMetrics = entry.metrics.filter((metric) => {
              const categoryExists = categories.some((c) => c.id === metric.categoryId)
              const metricExists =
                categoryExists &&
                categories.find((c) => c.id === metric.categoryId)?.metrics.some((m) => m.id === metric.metricId)

              return categoryExists && metricExists
            })

            // If we have valid metrics, update the entry, otherwise filter it out
            if (validMetrics.length > 0) {
              return {
                ...entry,
                metrics: validMetrics,
              }
            } else {
              return null // Will be filtered out
            }
          }

          return entry
        })
        .filter(Boolean) as WellnessEntry[]

      // Save fixed entries
      setEntries(fixedEntries)
    }

    // Recheck integrity after fixes
    const recheckIntegrity = checkDataIntegrity()

    if (recheckIntegrity.isValid) {
      toast({
        title: "Data Integrity Fixed",
        description: "Data integrity issues have been automatically fixed.",
      })

      return {
        fixed: true,
        message: "Data integrity issues have been successfully fixed.",
      }
    } else {
      toast({
        title: "Partial Data Fix",
        description: "Some data integrity issues remain. Manual intervention may be required.",
        variant: "destructive",
      })

      return {
        fixed: false,
        message: `Some data integrity issues remain: ${recheckIntegrity.recommendations.join("; ")}`,
      }
    }
  } catch (error) {
    console.error("Error fixing data integrity issues:", error)

    toast({
      title: "Error Fixing Data",
      description: "An error occurred while trying to fix data integrity issues.",
      variant: "destructive",
    })

    return {
      fixed: false,
      message: "An error occurred while fixing data integrity issues.",
    }
  }
}

// Export a data integrity check hook
export function useDataIntegrityCheck() {
  return {
    checkIntegrity: checkDataIntegrity,
    fixIssues: fixDataIntegrityIssues,
  }
}

import { toast } from "@/hooks/use-toast"
import { STORAGE_KEYS, safelyGetFromStorage, safelySetInStorage } from "@/utils/storage-utils"
import {
  type CategoriesStore,
  type GoalsStore,
  type EntriesStore,
  normalizedStoreToArray,
  arrayToNormalizedStore,
} from "@/utils/normalized-store"
import { categoriesArraySchema, goalsArraySchema, entriesArraySchema } from "@/schemas/wellness-schemas"

// Interface for integrity check results
export interface IntegrityCheckResult {
  isValid: boolean
  issues: IntegrityIssue[]
}

export interface IntegrityIssue {
  type: "error" | "warning"
  entity: "category" | "goal" | "entry" | "relationship" | "schema"
  id?: string
  message: string
  fixable: boolean
}

// Check for orphaned goals (goals referencing non-existent categories)
function checkOrphanedGoals(categories: CategoriesStore, goals: GoalsStore): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const categoryIds = new Set(Object.keys(categories.byId))

  Object.values(goals.byId).forEach((goal) => {
    if (!categoryIds.has(goal.categoryId)) {
      issues.push({
        type: "error",
        entity: "goal",
        id: goal.id,
        message: `Goal references non-existent category ID: ${goal.categoryId}`,
        fixable: true,
      })
    }
  })

  return issues
}

// Check for orphaned entries (entries referencing non-existent categories)
function checkOrphanedEntries(categories: CategoriesStore, entries: EntriesStore): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const categoryIds = new Set(Object.keys(categories.byId))

  Object.values(entries.byId).forEach((entry) => {
    if (!categoryIds.has(entry.categoryId)) {
      issues.push({
        type: "error",
        entity: "entry",
        id: entry.id,
        message: `Entry references non-existent category ID: ${entry.categoryId}`,
        fixable: true,
      })
    }
  })

  return issues
}

// Check for invalid metric references in goals
function checkInvalidMetricReferences(categories: CategoriesStore, goals: GoalsStore): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []

  Object.values(goals.byId).forEach((goal) => {
    const category = categories.byId[goal.categoryId]
    if (category) {
      const metricExists = category.metrics.some((metric) => metric.id === goal.metricId)
      if (!metricExists) {
        issues.push({
          type: "error",
          entity: "goal",
          id: goal.id,
          message: `Goal references non-existent metric ID: ${goal.metricId} in category: ${goal.categoryId}`,
          fixable: true,
        })
      }
    }
  })

  return issues
}

// Check for invalid metric references in entries
function checkInvalidEntryMetrics(categories: CategoriesStore, entries: EntriesStore): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []

  Object.values(entries.byId).forEach((entry) => {
    const category = categories.byId[entry.categoryId]
    if (category) {
      Object.keys(entry.metrics).forEach((metricId) => {
        const metricExists = category.metrics.some((metric) => metric.id === metricId)
        if (!metricExists) {
          issues.push({
            type: "error",
            entity: "entry",
            id: entry.id,
            message: `Entry contains non-existent metric ID: ${metricId} in category: ${entry.categoryId}`,
            fixable: true,
          })
        }
      })
    }
  })

  return issues
}

// Check for duplicate IDs
function checkDuplicateIds(categories: CategoriesStore, goals: GoalsStore, entries: EntriesStore): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const allIds = new Set<string>()

  // Check for duplicate category IDs
  const categoryIds = new Set<string>()
  Object.keys(categories.byId).forEach((id) => {
    if (categoryIds.has(id)) {
      issues.push({
        type: "error",
        entity: "category",
        id,
        message: `Duplicate category ID: ${id}`,
        fixable: true,
      })
    }
    categoryIds.add(id)
    allIds.add(id)
  })

  // Check for duplicate goal IDs
  const goalIds = new Set<string>()
  Object.keys(goals.byId).forEach((id) => {
    if (goalIds.has(id)) {
      issues.push({
        type: "error",
        entity: "goal",
        id,
        message: `Duplicate goal ID: ${id}`,
        fixable: true,
      })
    }
    goalIds.add(id)

    // Check for ID collisions across entity types
    if (allIds.has(id)) {
      issues.push({
        type: "error",
        entity: "goal",
        id,
        message: `Goal ID ${id} collides with another entity ID`,
        fixable: true,
      })
    }
    allIds.add(id)
  })

  // Check for duplicate entry IDs
  const entryIds = new Set<string>()
  Object.keys(entries.byId).forEach((id) => {
    if (entryIds.has(id)) {
      issues.push({
        type: "error",
        entity: "entry",
        id,
        message: `Duplicate entry ID: ${id}`,
        fixable: true,
      })
    }
    entryIds.add(id)

    // Check for ID collisions across entity types
    if (allIds.has(id)) {
      issues.push({
        type: "error",
        entity: "entry",
        id,
        message: `Entry ID ${id} collides with another entity ID`,
        fixable: true,
      })
    }
    allIds.add(id)
  })

  return issues
}

// Check for data integrity issues
export function checkDataIntegrity(): IntegrityCheckResult {
  try {
    // Get data
    const categories = safelyGetFromStorage(STORAGE_KEYS.CATEGORIES, categoriesArraySchema, [])
    const goals = safelyGetFromStorage(STORAGE_KEYS.GOALS, goalsArraySchema, [])
    const entries = safelyGetFromStorage(STORAGE_KEYS.ENTRIES, entriesArraySchema, [])

    // Run checks
    const orphanedGoalsIssues = checkOrphanedGoals(categories, goals)
    const orphanedEntriesIssues = checkOrphanedEntries(categories, entries)
    const invalidMetricIssues = checkInvalidMetricReferences(categories, goals)
    const invalidEntryMetricsIssues = checkInvalidEntryMetrics(categories, entries)
    const duplicateIdIssues = checkDuplicateIds(categories, goals, entries)

    // Combine all issues
    const allIssues = [
      ...orphanedGoalsIssues,
      ...orphanedEntriesIssues,
      ...invalidMetricIssues,
      ...invalidEntryMetricsIssues,
      ...duplicateIdIssues,
    ]

    return {
      isValid: allIssues.length === 0,
      issues: allIssues,
    }
  } catch (error) {
    console.error("Error checking data integrity:", error)
    return {
      isValid: false,
      issues: [
        {
          type: "error",
          entity: "schema",
          message: `Error checking data integrity: ${error}`,
          fixable: false,
        },
      ],
    }
  }
}

// Fix data integrity issues
export function fixDataIntegrityIssues(): boolean {
  try {
    // Get data
    const categories = safelyGetFromStorage(STORAGE_KEYS.CATEGORIES, categoriesArraySchema, [])
    const goals = safelyGetFromStorage(STORAGE_KEYS.GOALS, goalsArraySchema, [])
    const entries = safelyGetFromStorage(STORAGE_KEYS.ENTRIES, entriesArraySchema, [])

    // Create a backup before fixing
    const backup = {
      categories: normalizedStoreToArray(categories),
      goals: normalizedStoreToArray(goals),
      entries: normalizedStoreToArray(entries),
    }
    localStorage.setItem("wellness_integrity_backup", JSON.stringify(backup))

    // Fix orphaned goals
    const categoryIds = new Set(Object.keys(categories.byId))
    const updatedGoals = { ...goals }

    Object.keys(updatedGoals.byId).forEach((goalId) => {
      const goal = updatedGoals.byId[goalId]
      if (!categoryIds.has(goal.categoryId)) {
        // Remove orphaned goal
        delete updatedGoals.byId[goalId]
        updatedGoals.allIds = updatedGoals.allIds.filter((id) => id !== goalId)
      }
    })

    // Fix orphaned entries
    const updatedEntries = { ...entries }

    Object.keys(updatedEntries.byId).forEach((entryId) => {
      const entry = updatedEntries.byId[entryId]
      if (!categoryIds.has(entry.categoryId)) {
        // Remove orphaned entry
        delete updatedEntries.byId[entryId]
        updatedEntries.allIds = updatedEntries.allIds.filter((id) => id !== entryId)
      }
    })

    // Fix invalid metric references in goals
    Object.keys(updatedGoals.byId).forEach((goalId) => {
      const goal = updatedGoals.byId[goalId]
      const category = categories.byId[goal.categoryId]

      if (category) {
        const metricExists = category.metrics.some((metric) => metric.id === goal.metricId)
        if (!metricExists) {
          // Remove goal with invalid metric
          delete updatedGoals.byId[goalId]
          updatedGoals.allIds = updatedGoals.allIds.filter((id) => id !== goalId)
        }
      }
    })

    // Fix invalid metric references in entries
    Object.keys(updatedEntries.byId).forEach((entryId) => {
      const entry = updatedEntries.byId[entryId]
      const category = categories.byId[entry.categoryId]

      if (category) {
        const updatedMetrics: Record<string, number> = {}

        Object.keys(entry.metrics).forEach((metricId) => {
          const metricExists = category.metrics.some((metric) => metric.id === metricId)
          if (metricExists) {
            updatedMetrics[metricId] = entry.metrics[metricId]
          }
        })

        updatedEntries.byId[entryId] = {
          ...entry,
          metrics: updatedMetrics,
        }
      }
    })

    // Save fixed data
    safelySetInStorage(STORAGE_KEYS.GOALS, updatedGoals)
    safelySetInStorage(STORAGE_KEYS.ENTRIES, updatedEntries)

    toast({
      title: "Data Fixed",
      description: "Data integrity issues have been fixed.",
    })

    return true
  } catch (error) {
    console.error("Error fixing data integrity issues:", error)

    // Try to restore from backup
    try {
      const backupString = localStorage.getItem("wellness_integrity_backup")
      if (backupString) {
        const backup = JSON.parse(backupString)

        safelySetInStorage(STORAGE_KEYS.CATEGORIES, arrayToNormalizedStore(backup.categories))
        safelySetInStorage(STORAGE_KEYS.GOALS, arrayToNormalizedStore(backup.goals))
        safelySetInStorage(STORAGE_KEYS.ENTRIES, arrayToNormalizedStore(backup.entries))
      }
    } catch (restoreError) {
      console.error("Error restoring from backup:", restoreError)
    }

    toast({
      title: "Fix Failed",
      description: "Failed to fix data integrity issues.",
      variant: "destructive",
    })

    return false
  }
}

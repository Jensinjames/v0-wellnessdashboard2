import { categoryColors } from "@/lib/theme-config"

/**
 * Gets the color key for a category based on its ID or name
 */
export function getCategoryColorKey(id: string): string {
  const lowerCaseId = id.toLowerCase()

  if (lowerCaseId.includes("faith")) return "blue"
  if (lowerCaseId.includes("life")) return "yellow"
  if (lowerCaseId.includes("work")) return "red"
  if (lowerCaseId.includes("health")) return "green"
  if (lowerCaseId.includes("mind")) return "purple"
  if (lowerCaseId.includes("learn")) return "indigo"
  if (lowerCaseId.includes("relation")) return "pink"

  // Default fallback
  return "blue"
}

/**
 * Gets color classes for a category
 */
export function getCategoryColorClasses(categoryId: string, color?: string) {
  // Try to get from categoryColors first
  const categoryKey = categoryId.toLowerCase()
  const categoryColor = color || getCategoryColorKey(categoryId)

  if (categoryKey in categoryColors) {
    return {
      header: `bg-${categoryKey}-100 dark:bg-${categoryKey}-900 border-b border-${categoryKey}-200 dark:border-${categoryKey}-800`,
      headerText: `text-${categoryKey}-800 dark:text-${categoryKey}-200`,
      progress: `bg-${categoryKey}-600 dark:bg-${categoryKey}-500`,
      active: `bg-${categoryKey}-100 dark:bg-${categoryKey}-900 text-${categoryKey}-800 dark:text-${categoryKey}-200 border-b-2 border-${categoryKey}-600 dark:border-${categoryKey}-500`,
      inactive: `text-slate-600 dark:text-slate-400 hover:text-${categoryKey}-700 hover:dark:text-${categoryKey}-300 hover:bg-${categoryKey}-50 hover:dark:bg-${categoryKey}-950`,
    }
  }

  // Fallback to the color name
  return {
    header: `bg-${categoryColor}-100 dark:bg-${categoryColor}-900 border-b border-${categoryColor}-200 dark:border-${categoryColor}-800`,
    headerText: `text-${categoryColor}-800 dark:text-${categoryColor}-200`,
    progress: `bg-${categoryColor}-600 dark:bg-${categoryColor}-500`,
    active: `bg-${categoryColor}-100 dark:bg-${categoryColor}-900 text-${categoryColor}-800 dark:text-${categoryColor}-200 border-b-2 border-${categoryColor}-600 dark:border-${categoryColor}-500`,
    inactive: `text-slate-600 dark:text-slate-400 hover:text-${categoryColor}-700 hover:dark:text-${categoryColor}-300 hover:bg-${categoryColor}-50 hover:dark:bg-${categoryColor}-950`,
  }
}

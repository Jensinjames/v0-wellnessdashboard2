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
 * Gets header background color classes for a category
 */
export function getHeaderBackgroundClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  return `bg-${categoryColor}-100 dark:bg-${categoryColor}-900 border-b border-${categoryColor}-200 dark:border-${categoryColor}-800`
}

/**
 * Gets header text color classes for a category
 */
export function getHeaderTextClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  return `text-${categoryColor}-800 dark:text-${categoryColor}-200`
}

/**
 * Gets progress bar color classes for a category
 */
export function getProgressClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  return `bg-${categoryColor}-600 dark:bg-${categoryColor}-500`
}

/**
 * Gets active tab color classes for a category
 */
export function getActiveTabClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  return `bg-${categoryColor}-100 dark:bg-${categoryColor}-900 text-${categoryColor}-800 dark:text-${categoryColor}-200 border-b-2 border-${categoryColor}-600 dark:border-${categoryColor}-500`
}

/**
 * Gets inactive tab color classes for a category
 */
export function getInactiveTabClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  return `text-slate-600 dark:text-slate-400 hover:text-${categoryColor}-700 hover:dark:text-${categoryColor}-300 hover:bg-${categoryColor}-50 hover:dark:bg-${categoryColor}-950`
}

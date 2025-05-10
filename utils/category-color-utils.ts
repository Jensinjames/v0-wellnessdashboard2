/**
 * Gets the color key for a category based on its ID or name
 */
export function getCategoryColorKey(id: string, color?: string): string {
  if (color) {
    // If a color is provided, use it
    return color
  }

  // Otherwise, determine color based on ID
  const lowerCaseId = id.toLowerCase()

  if (lowerCaseId.includes("faith")) return "blue-500"
  if (lowerCaseId.includes("life")) return "yellow-500"
  if (lowerCaseId.includes("work")) return "red-500"
  if (lowerCaseId.includes("health")) return "green-500"
  if (lowerCaseId.includes("mind")) return "purple-500"
  if (lowerCaseId.includes("learn")) return "indigo-500"
  if (lowerCaseId.includes("relation")) return "pink-500"

  // Default fallback
  return "blue-500"
}

/**
 * Extracts the base color from a color string (e.g., "blue-500" -> "blue")
 */
export function getBaseColor(color: string): string {
  return color.split("-")[0]
}

/**
 * Extracts the shade from a color string (e.g., "blue-500" -> "500")
 */
export function getColorShade(color: string): string {
  const parts = color.split("-")
  return parts.length > 1 ? parts[1] : "500"
}

/**
 * Gets header background color classes for a category
 */
export function getHeaderBackgroundClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  const baseColor = getBaseColor(categoryColor)
  return `bg-${baseColor}-100 dark:bg-${baseColor}-900 border-b border-${baseColor}-200 dark:border-${baseColor}-800`
}

/**
 * Gets header text color classes for a category
 */
export function getHeaderTextClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  const baseColor = getBaseColor(categoryColor)
  return `text-${baseColor}-800 dark:text-${baseColor}-200`
}

/**
 * Gets progress bar color classes for a category
 */
export function getProgressClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  const baseColor = getBaseColor(categoryColor)
  const shade = getColorShade(categoryColor)
  return `bg-${baseColor}-${shade} dark:bg-${baseColor}-${Number.parseInt(shade) > 500 ? Number.parseInt(shade) - 100 : Number.parseInt(shade) + 100}`
}

/**
 * Gets active tab color classes for a category
 */
export function getActiveTabClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  const baseColor = getBaseColor(categoryColor)
  return `bg-${baseColor}-100 dark:bg-${baseColor}-900 text-${baseColor}-800 dark:text-${baseColor}-200 border-b-2 border-${baseColor}-600 dark:border-${baseColor}-500`
}

/**
 * Gets inactive tab color classes for a category
 */
export function getInactiveTabClasses(categoryId: string, color?: string): string {
  const categoryColor = color || getCategoryColorKey(categoryId)
  const baseColor = getBaseColor(categoryColor)
  return `text-slate-600 dark:text-slate-400 hover:text-${baseColor}-700 hover:dark:text-${baseColor}-300 hover:bg-${baseColor}-50 hover:dark:bg-${baseColor}-950`
}

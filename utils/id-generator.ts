/**
 * Utility functions for generating unique IDs
 */

/**
 * Converts a string to a slug format (lowercase, hyphens instead of spaces)
 * @param text The text to convert to a slug
 * @returns A slug version of the text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

/**
 * Generates a unique ID based on a name and checks against existing IDs
 * @param name The name to base the ID on
 * @param existingIds Array of existing IDs to check against
 * @returns A unique ID
 */
export function generateUniqueId(name: string, existingIds: string[]): string {
  if (!name) {
    // If no name is provided, generate a random ID
    return `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
  }

  // Create base ID from name
  let baseId = slugify(name)

  // If the base ID is empty after slugification, use a fallback
  if (!baseId) {
    baseId = `item-${Date.now().toString(36)}`
  }

  // Check if the ID already exists
  if (!existingIds.includes(baseId)) {
    return baseId
  }

  // If the ID exists, add a suffix
  let counter = 1
  let newId = `${baseId}-${counter}`

  // Keep incrementing the counter until we find a unique ID
  while (existingIds.includes(newId)) {
    counter++
    newId = `${baseId}-${counter}`
  }

  return newId
}

/**
 * Generates a timestamp-based unique ID with an optional prefix
 * @param prefix Optional prefix for the ID
 * @returns A unique ID
 */
export function generateTimestampId(prefix = ""): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 7)
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`
}

/**
 * Simple function to generate a unique ID
 * This is a simpler version that doesn't check against existing IDs
 * @returns A unique ID string
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

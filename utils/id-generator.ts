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
export function generateUniqueIdFromName(name: string, existingIds: string[]): string {
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
 * Generates a random ID
 * @returns A random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Generates a unique category ID based on the name
 * @param name The category name
 * @param existingIds Object containing existing category IDs as keys
 * @returns A unique category ID
 */
export function generateUniqueCategoryId(name: string, existingIds: Record<string, any>): string {
  if (!name) {
    return generateTimestampId("category")
  }

  // Create base ID from name
  let baseId = slugify(name)

  // If the base ID is empty after slugification, use a fallback
  if (!baseId) {
    baseId = `category-${Date.now().toString(36)}`
  }

  // Check if the ID already exists
  if (!existingIds[baseId]) {
    return baseId
  }

  // If the ID exists, add a suffix
  let counter = 1
  let newId = `${baseId}-${counter}`

  // Keep incrementing the counter until we find a unique ID
  while (existingIds[newId]) {
    counter++
    newId = `${baseId}-${counter}`
  }

  return newId
}

/**
 * Generates a unique metric ID based on the name
 * @param name The metric name
 * @param existingIds Array of existing metric IDs
 * @returns A unique metric ID
 */
export function generateUniqueMetricId(name: string, existingIds: string[]): string {
  if (!name) {
    return generateTimestampId("metric")
  }

  // Create base ID from name
  let baseId = slugify(name)

  // If the base ID is empty after slugification, use a fallback
  if (!baseId) {
    baseId = `metric-${Date.now().toString(36)}`
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
 * Generates a unique ID based on current timestamp and random string
 * @returns A unique string ID
 */
export function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Checks if an ID already exists in a collection
 * @param id The ID to check
 * @param collection Object with IDs as keys
 * @returns True if the ID exists, false otherwise
 */
export function idExists(id: string, collection: Record<string, unknown>): boolean {
  return id in collection
}

/**
 * Generates a unique ID that doesn't exist in the collection
 * @param collection Object with IDs as keys
 * @returns A unique string ID
 */
export function generateUniqueIdForCollection(collection: Record<string, unknown>): string {
  let id = generateUniqueId()
  while (idExists(id, collection)) {
    id = generateUniqueId()
  }
  return id
}

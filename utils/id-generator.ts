/**
 * Generates a unique ID based on a name and ensures it doesn't conflict with existing IDs
 * @param name The name to base the ID on
 * @param existingIds Array of existing IDs to check against
 * @returns A unique ID
 */
export const generateUniqueId = (name: string, existingIds: string[] = []): string => {
  // Convert name to lowercase and replace spaces with hyphens
  let baseId = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove any characters that aren't alphanumeric or hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-|-$/g, "") // Remove leading and trailing hyphens

  // If the baseId is empty (e.g., if the name contained only special characters), use a fallback
  if (!baseId) {
    baseId = "item"
  }

  // Check if the ID already exists
  let uniqueId = baseId
  let counter = 1

  while (existingIds.includes(uniqueId)) {
    uniqueId = `${baseId}-${counter}`
    counter++
  }

  return uniqueId
}

/**
 * Generates a simple unique ID without checking against existing IDs
 * @returns A unique ID string
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * Generates a UUID (v4)
 * @returns A UUID string
 */
export const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generates a short ID suitable for display
 * @param length The length of the ID (default: 8)
 * @returns A short ID string
 */
export const generateShortId = (length = 8): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

/**
 * Generates a sequential ID with a prefix
 * @param prefix The prefix to use (default: 'id')
 * @param counter The starting counter value (default: 1)
 * @returns A function that generates sequential IDs
 */
export const createSequentialIdGenerator = (prefix = "id", counter = 1) => {
  return (): string => {
    return `${prefix}-${counter++}`
  }
}

/**
 * Decodes a potentially encoded redirect path
 */
export function decodeRedirectPath(path: string): string {
  try {
    // Handle double-encoded paths
    return decodeURIComponent(path)
  } catch (e) {
    // If decoding fails, return the original path
    console.error("Error decoding redirect path:", e)
    return path
  }
}

/**
 * Validates if a path is a valid redirect path
 * - Must start with /
 * - Must not contain protocol or domain
 */
export function isValidRedirectPath(path: string): boolean {
  if (!path) return false

  // Path must start with /
  if (!path.startsWith("/")) return false

  // Path must not contain protocol or domain
  if (path.includes("://") || path.includes("//")) return false

  return true
}

/**
 * Stores the redirect path in session storage
 */
export function storeRedirectPath(path: string): void {
  if (typeof window !== "undefined" && isValidRedirectPath(path)) {
    sessionStorage.setItem("authRedirectPath", path)
  }
}

/**
 * Retrieves the stored redirect path
 */
export function getStoredRedirectPath(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("authRedirectPath")
  }
  return null
}

/**
 * Clears the stored redirect path
 */
export function clearStoredRedirectPath(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("authRedirectPath")
  }
}

/**
 * Gets a safe redirect path - either the provided path if valid,
 * or the stored path, or the default path
 */
export function getSafeRedirectPath(path: string | null, defaultPath = "/"): string {
  // Check the provided path first
  if (path && isValidRedirectPath(path)) {
    return path
  }

  // Check stored path next
  const storedPath = getStoredRedirectPath()
  if (storedPath && isValidRedirectPath(storedPath)) {
    // Clear the stored path to prevent reuse
    clearStoredRedirectPath()
    return storedPath
  }

  // Fall back to default path
  return defaultPath
}

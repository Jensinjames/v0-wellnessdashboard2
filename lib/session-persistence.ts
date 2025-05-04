/**
 * Service to manage session persistence preferences
 */

const REMEMBER_ME_KEY = "wellness_dashboard_remember_me"

/**
 * Get the current "Remember me" preference
 * @returns {boolean} The current preference (defaults to false)
 */
export function getRememberMe(): boolean {
  if (typeof window === "undefined") return false

  try {
    const stored = localStorage.getItem(REMEMBER_ME_KEY)
    return stored ? JSON.parse(stored) : false
  } catch (error) {
    console.error("Error retrieving remember me preference:", error)
    return false
  }
}

/**
 * Set the "Remember me" preference
 * @param {boolean} value - The preference value to store
 */
export function setRememberMe(value: boolean): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(value))
  } catch (error) {
    console.error("Error storing remember me preference:", error)
  }
}

/**
 * Clear the "Remember me" preference
 */
export function clearRememberMe(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(REMEMBER_ME_KEY)
  } catch (error) {
    console.error("Error clearing remember me preference:", error)
  }
}

/**
 * Get the appropriate persistence type based on the "Remember me" preference
 * @returns {'local' | 'session'} The persistence type
 */
export function getPersistenceType(): "local" | "session" {
  return getRememberMe() ? "local" : "session"
}

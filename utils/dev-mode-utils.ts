/**
 * Development Mode Utilities
 *
 * These utilities help with development and testing by providing
 * mock functionality when running in development mode.
 */

/**
 * Check if we're in development mode
 */
export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development"
}

/**
 * Check if we should mock email success
 */
export function shouldMockEmailSuccess(): boolean {
  if (!isDevMode()) return false

  // Check environment variable first
  if (process.env.NEXT_PUBLIC_MOCK_EMAIL_SUCCESS === "true") return true

  // Then check localStorage if we're in the browser
  if (typeof window !== "undefined") {
    return localStorage.getItem("mock_email_success") === "true"
  }

  return false
}

/**
 * Enable mock email success
 */
export function enableMockEmailSuccess(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("mock_email_success", "true")
    console.log("Mock email success enabled")
  }
}

/**
 * Disable mock email success
 */
export function disableMockEmailSuccess(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("mock_email_success")
    console.log("Mock email success disabled")
  }
}

/**
 * Set temporary access email for development testing
 */
export function setTempAccessEmail(email: string): void {
  if (!isDevMode()) {
    console.warn("Temp access email can only be set in development mode")
    return
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("dev_temp_access", email)
    console.log(`Temporary access email set to: ${email}`)
  }
}

/**
 * Get temporary access email
 */
export function getTempAccessEmail(): string | null {
  if (!isDevMode()) return null

  if (typeof window !== "undefined") {
    return localStorage.getItem("dev_temp_access")
  }

  return null
}

/**
 * Clear temporary access email
 */
export function clearTempAccessEmail(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dev_temp_access")
    console.log("Temporary access email cleared")
  }
}

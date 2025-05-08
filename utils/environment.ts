/**
 * Environment Utilities
 * Helper functions for environment detection and configuration
 */

// Check if code is running in a client (browser) context
export function isClient(): boolean {
  return typeof window !== "undefined"
}

// Check if code is running in a server context
export function isServer(): boolean {
  return !isClient()
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

// Check if we're in production mode
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

// Check if debug mode is enabled
export function isDebugMode(): boolean {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    return true
  }

  // Then check localStorage if in client context
  if (isClient()) {
    return localStorage.getItem("debug_mode") === "true"
  }

  return false
}

// Set debug mode in localStorage
export function setDebugMode(enabled: boolean): void {
  if (isClient()) {
    localStorage.setItem("debug_mode", enabled ? "true" : "false")
    console.log(`Debug mode ${enabled ? "enabled" : "disabled"}`)
  }
}

// Get the current environment name
export function getEnvironment(): string {
  return process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "production"
}

// Check if we're in a specific environment
export function isEnvironment(env: string): boolean {
  return getEnvironment() === env
}

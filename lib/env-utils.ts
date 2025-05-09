/**
 * Environment utility functions for the application
 */

// Check if we're in a browser environment
export const isBrowser = typeof window !== "undefined"
export const isServer = !isBrowser

/**
 * Gets the current application environment
 * @returns The application environment, or "production" if not set
 */
export function getEnvironment(): string {
  if (typeof process === "undefined" || !process.env) {
    return "production"
  }

  return process.env.NODE_ENV || "production"
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return getEnvironment() === "development"
}

// Check if we're in production mode
export function isProduction(): boolean {
  return getEnvironment() === "production"
}

// Check if we're in test mode
export function isTest(): boolean {
  return getEnvironment() === "test"
}

/**
 * Gets an environment variable
 * @param key The name of the environment variable
 * @param defaultValue A default value to return if the variable is not set
 * @returns The value of the environment variable, or the default value if not set
 */
export function getEnvVariable(key: string, defaultValue?: string): string {
  if (typeof process === "undefined" || !process.env) {
    return defaultValue || ""
  }

  return process.env[key] || defaultValue || ""
}

/**
 * Validates that required environment variables are set
 * @param requiredVars An array of environment variable names that are required
 * @returns An object indicating whether all required variables are set, and a list of any missing variables
 */
export function validateRequiredEnvVars(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing = requiredVars.filter((variable) => !process.env[variable])
  return {
    valid: missing.length === 0,
    missing,
  }
}

// Check if debug mode is enabled
export function isDebugMode(): boolean {
  // First check environment variable
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    return true
  }

  // Then check localStorage in browser context
  if (isBrowser) {
    try {
      return localStorage.getItem("debug_mode") === "true"
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Default to false
  return false
}

// Enable or disable debug mode
export function setDebugMode(enabled: boolean): void {
  if (isBrowser) {
    try {
      localStorage.setItem("debug_mode", enabled ? "true" : "false")
      console.log(`Debug mode ${enabled ? "enabled" : "disabled"}`)
    } catch (e) {
      console.error("Failed to set debug mode in localStorage:", e)
    }
  }
}

/**
 * Gets the application version
 * @returns The application version, or "0.0.0" if not set
 */
export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"
}

// Get the Supabase URL
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ""
}

// Get the Supabase anon key
export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
}

// Check if Supabase credentials are configured
export function isSupabaseConfigured(): boolean {
  return !!getSupabaseUrl() && !!getSupabaseAnonKey()
}

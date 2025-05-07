/**
 * Secure Environment Utilities
 *
 * Safely access environment variables with proper client/server detection
 * and without exposing NODE_ENV directly on the client
 */

// Environment detection - using more secure approach
export const isServer = typeof window === "undefined"
export const isBrowser = !isServer

// Get environment safely without exposing NODE_ENV
export function getEnvironment(): string {
  // Only use NEXT_PUBLIC prefixed variables on client
  if (isBrowser) {
    return process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "production"
  }
  // On server, we can safely use NODE_ENV
  else {
    return process.env.NODE_ENV || "production"
  }
}

// Check if we're in development mode safely
export function isDevelopment(): boolean {
  return getEnvironment() === "development"
}

// Check if we're in production mode safely
export function isProduction(): boolean {
  return getEnvironment() === "production"
}

// Check if we're in test mode safely
export function isTest(): boolean {
  return getEnvironment() === "test"
}

// Get debug mode status safely
export function isDebugMode(): boolean {
  if (isBrowser) {
    // Only use client-safe variables
    return (
      process.env.NEXT_PUBLIC_DEBUG_MODE === "true" ||
      (typeof localStorage !== "undefined" && localStorage.getItem("debug_mode") === "true")
    )
  } else {
    // On server, we can use any env var
    return process.env.DEBUG_MODE === "true"
  }
}

// Safe access to environment variables
export function getEnvVariable(key: string, defaultValue = ""): string {
  // For client-side, only NEXT_PUBLIC_ variables are accessible
  if (isBrowser && !key.startsWith("NEXT_PUBLIC_")) {
    console.warn(`Attempted to access non-public env variable "${key}" on client side. This is not allowed.`)
    return defaultValue
  }

  return (process.env[key] as string) || defaultValue
}

// Get app version safely
export function getAppVersion(): string {
  return getEnvVariable("NEXT_PUBLIC_APP_VERSION", "1.0.0")
}

// Validate required environment variables
export function validateRequiredEnvVars(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const key of requiredVars) {
    // For client-side, only check NEXT_PUBLIC_ variables
    if (isBrowser && !key.startsWith("NEXT_PUBLIC_")) continue

    if (!getEnvVariable(key)) {
      missing.push(key)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

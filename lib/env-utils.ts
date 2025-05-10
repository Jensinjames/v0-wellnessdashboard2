/**
 * Environment Utilities
 * Safe access to environment variables with proper client/server detection
 */

// Client-side environment variables
export const clientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "development",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : ""),
  STATSIG_CLIENT_KEY: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY,
}

// Detect environment
export function getEnvironment(): "development" | "test" | "production" {
  // Use NEXT_PUBLIC_APP_ENVIRONMENT as the source of truth
  if (clientEnv.APP_ENVIRONMENT === "production") return "production"
  if (clientEnv.APP_ENVIRONMENT === "test") return "test"
  return "development"
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

// Check if debug mode is enabled
export function isDebugMode(): boolean {
  if (typeof window !== "undefined") {
    return clientEnv.DEBUG_MODE || localStorage.getItem("debug_mode") === "true" || isDevelopment()
  }
  return clientEnv.DEBUG_MODE || isDevelopment()
}

// Get app version
export function getAppVersion(): string {
  return clientEnv.APP_VERSION
}

// Get site URL
export function getSiteUrl(): string {
  return clientEnv.SITE_URL
}

// Validate required environment variables
export function validateClientEnv(): { valid: boolean; missing: string[] } {
  const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
  const missing = requiredVars.filter((key) => !clientEnv[key as keyof typeof clientEnv])

  if (missing.length > 0 && typeof window !== "undefined") {
    console.error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Server-side only environment check
export function isServer(): boolean {
  return typeof window === "undefined"
}

// Client-side only environment check
export function isClient(): boolean {
  return !isServer()
}

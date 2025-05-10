/**
 * Safe environment variable access
 * Prevents "NODE_ENV cannot be accessed on the client" errors
 */

// Public environment variables (safe for client)
export const publicEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "development",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
}

// Server-only environment check
export function isServer(): boolean {
  return typeof window === "undefined"
}

// Client-only environment check
export function isClient(): boolean {
  return !isServer()
}

// Safe environment detection that works on both client and server
export const environment = {
  isDevelopment: publicEnv.APP_ENVIRONMENT === "development",
  isProduction: publicEnv.APP_ENVIRONMENT === "production",
  isTest: publicEnv.APP_ENVIRONMENT === "test",
}

// Safe debug mode check
export function isDebugMode(): boolean {
  if (isClient()) {
    return publicEnv.DEBUG_MODE || localStorage.getItem("debug_mode") === "true" || environment.isDevelopment
  }
  return publicEnv.DEBUG_MODE || environment.isDevelopment
}

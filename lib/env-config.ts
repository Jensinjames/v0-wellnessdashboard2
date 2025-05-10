/**
 * Environment configuration
 * Safely handles environment variables and prevents client-side access to server-only variables
 */

// Client-safe environment variables (prefixed with NEXT_PUBLIC_)
export const clientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "development",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
}

// Server-only environment variables (never exposed to the client)
export const serverEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
}

// Environment detection that's safe for both client and server
export const ENV = {
  isDevelopment: clientEnv.APP_ENVIRONMENT === "development",
  isProduction: clientEnv.APP_ENVIRONMENT === "production",
  isTest: clientEnv.APP_ENVIRONMENT === "test",
  debugMode: clientEnv.DEBUG_MODE,
}

// Validate required environment variables
export function validateEnv(): boolean {
  const requiredClientVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]

  for (const key of requiredClientVars) {
    if (!clientEnv[key as keyof typeof clientEnv]) {
      console.error(`Missing required environment variable: NEXT_PUBLIC_${key}`)
      return false
    }
  }

  return true
}

// Safe environment check that works on both client and server
export function isServer(): boolean {
  return typeof window === "undefined"
}

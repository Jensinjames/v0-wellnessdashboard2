/**
 * Environment Configuration
 * This file centralizes access to environment variables and ensures they're used correctly
 */

// Server-side environment variables (not prefixed with NEXT_PUBLIC_)
// IMPORTANT: This object should ONLY be accessed on the server
export const SERVER_ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  SUPABASE_EDGE_FUNCTION_URL: process.env.SUPABASE_EDGE_FUNCTION_URL,
  SUPABASE_EDGE_FUNCTION_KEY: process.env.SUPABASE_EDGE_FUNCTION_KEY,
}

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const CLIENT_ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "production",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
}

// Check if we're in a server context
export function isServer(): boolean {
  return typeof window === "undefined"
}

// Validate server environment variables - ONLY call this on the server
export function validateServerEnv(): { valid: boolean; missing: string[] } {
  if (!isServer()) {
    console.warn("validateServerEnv should only be called on the server")
    return { valid: false, missing: ["SERVER_CONTEXT_REQUIRED"] }
  }

  const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
  const missing = requiredVars.filter((key) => !SERVER_ENV[key as keyof typeof SERVER_ENV])

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Validate client environment variables - Safe to call anywhere
export function validateClientEnv(): { valid: boolean; missing: string[] } {
  const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
  const missing = requiredVars.filter((key) => !CLIENT_ENV[key as keyof typeof CLIENT_ENV])

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Get the appropriate environment variables based on context
export function getSupabaseEnv() {
  return isServer() ? SERVER_ENV : CLIENT_ENV
}

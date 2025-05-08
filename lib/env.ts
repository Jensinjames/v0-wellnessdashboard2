/**
 * Environment utilities for safe access to environment variables
 */

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const clientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "development",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
}

// Server-side environment variables (never exposed to the client)
export const serverEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  SUPABASE_EDGE_FUNCTION_URL: process.env.SUPABASE_EDGE_FUNCTION_URL,
  SUPABASE_EDGE_FUNCTION_KEY: process.env.SUPABASE_EDGE_FUNCTION_KEY,
  DEBUG_MODE: process.env.DEBUG_MODE === "true",
}

// Check if code is running on client or server
export function isClient(): boolean {
  return typeof window !== "undefined"
}

// Check if code is running on server
export function isServer(): boolean {
  return !isClient()
}

/**
 * Get Supabase credentials with proper fallbacks
 * This function handles both client and server environments
 */
export function getSupabaseCredentials(): { supabaseUrl: string | null; supabaseKey: string | null } {
  // On the server, try to use server-specific env vars first, then fall back to NEXT_PUBLIC ones
  if (isServer()) {
    const url = serverEnv.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null
    const key = serverEnv.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null

    return {
      supabaseUrl: url,
      supabaseKey: key,
    }
  }

  // On the client, we can only use NEXT_PUBLIC env vars
  return {
    supabaseUrl: clientEnv.SUPABASE_URL || null,
    supabaseKey: clientEnv.SUPABASE_ANON_KEY || null,
  }
}

// Validate required environment variables
export function validateEnv(): boolean {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

  if (isClient()) {
    // Client-side validation
    return !!supabaseUrl && !!supabaseKey
  } else {
    // Server-side validation
    return !!supabaseUrl && !!supabaseKey && !!process.env.SUPABASE_SERVICE_ROLE_KEY
  }
}

// Get environment name
export function getEnvironment(): "development" | "production" | "test" {
  return (clientEnv.APP_ENVIRONMENT || "development") as "development" | "production" | "test"
}

// Check if in development mode
export function isDevelopment(): boolean {
  return getEnvironment() === "development"
}

// Check if in production mode
export function isProduction(): boolean {
  return getEnvironment() === "production"
}

// Check if in test mode
export function isTest(): boolean {
  return getEnvironment() === "test"
}

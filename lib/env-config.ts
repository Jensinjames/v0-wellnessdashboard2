// Environment variable configuration
// This file centralizes all environment variable access

// Server-side environment variables (not prefixed with NEXT_PUBLIC_)
export const SERVER_ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
}

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const CLIENT_ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "production",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
}

// Validate server environment variables
export function validateServerEnv(): { valid: boolean; missing: string[] } {
  const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
  const missing = requiredVars.filter((key) => !SERVER_ENV[key as keyof typeof SERVER_ENV])

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Validate client environment variables
export function validateClientEnv(): { valid: boolean; missing: string[] } {
  const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
  const missing = requiredVars.filter((key) => !CLIENT_ENV[key as keyof typeof CLIENT_ENV])

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Check if we're in a server context
export function isServer(): boolean {
  return typeof window === "undefined"
}

// Get the appropriate environment variables based on context
export function getSupabaseEnv() {
  if (isServer()) {
    const validation = validateServerEnv()
    if (!validation.valid) {
      console.error(`Missing required server environment variables: ${validation.missing.join(", ")}`)
      throw new Error(`Missing required server environment variables: ${validation.missing.join(", ")}`)
    }
    return SERVER_ENV
  } else {
    const validation = validateClientEnv()
    if (!validation.valid) {
      console.error(`Missing required client environment variables: ${validation.missing.join(", ")}`)
      throw new Error(`Missing required client environment variables: ${validation.missing.join(", ")}`)
    }
    return CLIENT_ENV
  }
}

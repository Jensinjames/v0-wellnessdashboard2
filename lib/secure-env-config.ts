// Secure environment configuration
// This file ensures sensitive variables are only used in the appropriate context

// Server-side only environment variables (never exposed to client)
export const SERVER_ENV = {
  // Database connection
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,

  // Database connection details
  POSTGRES_URL: process.env.POSTGRES_URL,
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
  POSTGRES_HOST: process.env.POSTGRES_HOST,

  // Application settings
  DEBUG_MODE: process.env.DEBUG_MODE === "true",
}

// Client-side environment variables (safe to expose to browser)
export const CLIENT_ENV = {
  // Public Supabase credentials (safe for client)
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // Application settings
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

// Get environment variables based on context
export function getEnv(isServerSide: boolean) {
  return isServerSide ? SERVER_ENV : CLIENT_ENV
}

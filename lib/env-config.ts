/**
 * Environment Configuration
 * Centralized management of environment variables with proper client/server separation
 */

// Server-side environment variables (NEVER exposed to client)
// IMPORTANT: This object should ONLY be accessed in server components or API routes
export const SERVER_ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  SUPABASE_EDGE_FUNCTION_URL: process.env.SUPABASE_EDGE_FUNCTION_URL,
  SUPABASE_EDGE_FUNCTION_KEY: process.env.SUPABASE_EDGE_FUNCTION_KEY,
}

// Client-side environment variables (safe to use anywhere)
// These MUST be prefixed with NEXT_PUBLIC_
export const CLIENT_ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "production",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  DEBUG_LEVEL: process.env.NEXT_PUBLIC_DEBUG_LEVEL ? Number.parseInt(process.env.NEXT_PUBLIC_DEBUG_LEVEL) : 1,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
}

// Check if we're in a server context
export function isServer(): boolean {
  return typeof window === "undefined"
}

// Check if we're in a middleware context
export function isMiddleware(): boolean {
  // In middleware, process.env.NEXT_RUNTIME === 'edge'
  return typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge"
}

// Get the appropriate environment variables based on context
export function getSupabaseEnv() {
  // Always use client env in middleware to avoid issues
  if (isMiddleware()) {
    return {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  }

  return isServer() ? SERVER_ENV : CLIENT_ENV
}

// Validate server environment variables - ONLY call this on the server
export function validateServerEnv(): { valid: boolean; missing: string[] } {
  // Don't validate in middleware
  if (isMiddleware()) {
    return { valid: true, missing: [] }
  }

  if (!isServer()) {
    console.warn("validateServerEnv should only be called on the server")
    return { valid: false, missing: ["SERVER_CONTEXT_REQUIRED"] }
  }

  const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
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

// Validate middleware environment variables
export function validateMiddlewareEnv(): { valid: boolean; missing: string[] } {
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  const missing = requiredVars.filter((key) => !process.env[key])

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Get edge function URL with proper environment handling
export function getEdgeFunctionUrl(functionName: string): string {
  // In middleware, always use the public URL
  if (isMiddleware()) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`
      : `https://jziyyspmahgrvfkpuisa.supabase.co/functions/v1/${functionName}`
  }

  const baseUrl = isServer() ? SERVER_ENV.SUPABASE_EDGE_FUNCTION_URL : `${CLIENT_ENV.SUPABASE_URL}/functions/v1`

  if (!baseUrl) {
    return `https://jziyyspmahgrvfkpuisa.supabase.co/functions/v1/${functionName}`
  }

  return `${baseUrl.replace(/\/$/, "")}/${functionName}`
}

// Get edge function key - ONLY call this on the server
export function getEdgeFunctionKey(): string | undefined {
  if (isMiddleware()) {
    return undefined
  }

  if (!isServer()) {
    console.warn("getEdgeFunctionKey should only be called on the server")
    return undefined
  }

  return SERVER_ENV.SUPABASE_EDGE_FUNCTION_KEY
}

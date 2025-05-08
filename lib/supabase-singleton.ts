/**
 * Supabase Singleton
 * This file ensures we only have one Supabase client instance across the application
 */

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for Supabase singleton operations
const logger = createLogger("SupabaseSingleton")

// Global variable to store the Supabase client instance
let instance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Telemetry
let creationCount = 0
let lastCreatedAt: number | null = null
let isDebugMode = false

/**
 * Get the Supabase client instance
 * This function ensures we only have one instance across the application
 */
export function getSupabaseSingleton() {
  // If we already have an instance, return it
  if (instance) {
    return instance
  }

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    throw new Error("getSupabaseSingleton should only be called in browser environments")
  }

  // Check if required environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logger.error("Missing Supabase environment variables")
    throw new Error("Supabase configuration is missing. Please check your environment variables.")
  }

  // Create a new instance
  logger.info("Creating new Supabase singleton instance")
  instance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "x-application-name": "wellness-dashboard-singleton",
          "x-client-info": window.navigator.userAgent,
        },
      },
      debug: isDebugMode,
    },
  )

  // Update telemetry
  creationCount++
  lastCreatedAt = Date.now()

  // Return the instance
  return instance
}

/**
 * Reset the Supabase client instance
 * This is useful for testing or when auth state changes
 */
export function resetSupabaseSingleton() {
  if (instance) {
    logger.info("Resetting Supabase singleton instance")
    instance = null
  }
}

/**
 * Get telemetry data about the Supabase client instance
 */
export function getSupabaseSingletonTelemetry() {
  return {
    isInitialized: !!instance,
    creationCount,
    lastCreatedAt,
    isDebugMode,
  }
}

/**
 * Enable or disable debug mode
 */
export function setSupabaseSingletonDebugMode(enabled: boolean) {
  isDebugMode = enabled
  logger.info(`Supabase singleton debug mode ${enabled ? "enabled" : "disabled"}`)
}

/**
 * Get the current auth session
 */
export async function getSupabaseSingletonSession() {
  const supabase = getSupabaseSingleton()
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      logger.error("Error getting session:", error)
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (sessionError) {
    logger.error("Exception getting session:", sessionError)
    return { session: null, error: sessionError instanceof Error ? sessionError : new Error(String(sessionError)) }
  }
}

/**
 * Get the current user
 */
export async function getSupabaseSingletonUser() {
  try {
    const supabase = getSupabaseSingleton()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      logger.error("Error getting user:", error)
      return { user: null, error }
    }

    if (!data?.user) {
      return { user: null, error: new Error("No user data returned") }
    }

    return { user: data.user, error: null }
  } catch (error) {
    logger.error("Unexpected error getting user:", error)
    return { user: null, error }
  }
}

/**
 * Alias for getSupabaseSingleton for backward compatibility
 */
export const getSupabaseClient = getSupabaseSingleton

/**
 * Get detailed debug information about the Supabase singleton
 */
export function getSupabaseSingletonDebugInfo() {
  const telemetry = getSupabaseSingletonTelemetry()

  return {
    ...telemetry,
    instanceExists: !!instance,
    environmentVariables: {
      urlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    browserEnvironment: typeof window !== "undefined",
    timestamp: new Date().toISOString(),
  }
}

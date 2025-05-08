/**
 * Supabase Client
 * This file provides utilities for creating and managing Supabase clients
 */

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for Supabase client operations
const logger = createLogger("SupabaseClient")

// Track client instances to prevent duplicates
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Telemetry
let instanceCount = 0
let lastInitTime: number | null = null
let lastResetTime: number | null = null
let debugMode = false

// Create and return a Supabase client for browser usage
export function getSupabase() {
  if (!supabaseClient) {
    try {
      // Check if required environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        logger.error("Missing Supabase environment variables")
        throw new Error("Supabase configuration is missing. Please check your environment variables.")
      }

      // Create a new client if one doesn't exist
      logger.info("Creating new Supabase client instance")
      supabaseClient = createBrowserClient<Database>(
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
              "x-application-name": "wellness-dashboard-client",
              "x-client-info": `${typeof window !== "undefined" ? window.navigator.userAgent : "server"}`,
            },
          },
          // Add error handling for auth operations
          debug: debugMode,
        },
      )

      // Track instance count and time
      instanceCount++
      lastInitTime = Date.now()

      if (debugMode) {
        logger.info("Supabase client created successfully")
      }
    } catch (error) {
      logger.error("Error initializing Supabase client:", error)
      throw error
    }
  } else {
    if (debugMode) {
      logger.info("Reusing existing Supabase client instance")
    }
  }

  return supabaseClient
}

// Export with the old name for backward compatibility
export const getSupabaseClient = getSupabase

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseClient() {
  if (supabaseClient) {
    logger.info("Resetting Supabase client")
    supabaseClient = null
    lastResetTime = Date.now()
    if (debugMode) {
      logger.info("Supabase client reset")
    }
  }
}

// Monitor GoTrue client instances (for debugging)
export function monitorGoTrueClientInstances(intervalMs = 10000): () => void {
  if (typeof window === "undefined") {
    // No-op for server-side
    return () => {}
  }

  // Set up interval to check for multiple instances
  const intervalId = setInterval(() => {
    // Simple check - we don't need complex monitoring for now
    if (supabaseClient) {
      logger.info("Supabase client is initialized")
    }
  }, intervalMs)

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
  }
}

// Get the current auth state
export async function getCurrentSession() {
  const supabase = getSupabase()
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

// Get the current user
export async function getCurrentUser() {
  try {
    const supabase = getSupabase()
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

// Check the Supabase connection health
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // If we don't have a client yet, create one
    if (!supabaseClient) {
      getSupabase()
    }

    // If we still don't have a client, return false
    if (!supabaseClient) {
      return false
    }

    // Simple health check query
    try {
      const { error } = await supabaseClient.from("profiles").select("count").limit(1)

      if (error) {
        logger.error("Supabase connection test error:", error.message)
        return false
      }

      return true
    } catch (queryError) {
      logger.error("Exception in Supabase connection test:", queryError)
      return false
    }
  } catch (error: any) {
    logger.error("Supabase connection test exception:", error.message || "Unknown error")
    return false
  }
}

// Get the current client without creating a new one
export function getCurrentClient() {
  return supabaseClient
}

/**
 * Enable/disable debug logging
 */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
    logger.info(`Supabase client debug mode ${enabled ? "enabled" : "disabled"}`)
  }
}

/**
 * Get connection health metrics
 */
export function getConnectionHealth() {
  return {
    isInitialized: !!supabaseClient,
    isHealthy: !!supabaseClient,
    clientInstanceCount: instanceCount,
    lastInitTime,
    lastResetTime,
    debugMode,
  }
}

/**
 * Cleanup any orphaned Supabase client instances
 */
export function cleanupOrphanedClients(): void {
  logger.info("Cleaning up orphaned Supabase client instances")

  // Reset the client
  supabaseClient = null

  // Force garbage collection if possible
  if (typeof window !== "undefined" && (window as any).gc) {
    try {
      ;(window as any).gc()
    } catch (e) {
      // Ignore errors, gc might not be available
    }
  }

  logger.info("Orphaned clients cleanup complete")
}

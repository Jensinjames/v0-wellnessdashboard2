import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { logger } from "@/utils/logger"

// Global singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null
let instanceCount = 0
let lastInitTime: number | null = null

// Registry to track GoTrueClient instances
const goTrueRegistry = new Set<any>()

/**
 * Get the Supabase client singleton
 * This ensures only one client instance is created per browser context
 */
export function getSupabaseSingleton(): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Return existing initialization promise if in progress
  if (isInitializing && initializationPromise) {
    return initializationPromise
  }

  // Set initializing flag
  isInitializing = true
  instanceCount++

  // Create initialization promise
  initializationPromise = new Promise<SupabaseClient<Database>>((resolve, reject) => {
    try {
      logger.debug("Creating new Supabase singleton instance")

      // Record initialization time
      lastInitTime = Date.now()

      // Check if required environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase configuration is missing. Please check your environment variables.")
      }

      // Create client with enhanced options
      const newClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
            // Use a consistent storage key to prevent conflicts
            storageKey: "wellness-dashboard-auth-singleton",
          },
          global: {
            headers: {
              "x-application-name": "wellness-dashboard",
              "x-client-instance": `singleton-${instanceCount}`,
              "x-client-init-time": lastInitTime.toString(),
            },
          },
        },
      )

      // Store the client
      supabaseInstance = newClient

      // Track the GoTrueClient instance
      if (newClient.auth && (newClient.auth as any)._goTrueClient) {
        const goTrueClient = (newClient.auth as any)._goTrueClient

        // Clear any existing instances before adding the new one
        goTrueRegistry.clear()
        goTrueRegistry.add(goTrueClient)

        logger.debug(`Registered GoTrueClient instance in singleton. Total instances: ${goTrueRegistry.size}`)
      }

      // Reset initialization state
      isInitializing = false

      // Resolve with the client
      resolve(newClient)
    } catch (error) {
      // Reset initialization state
      isInitializing = false
      initializationPromise = null

      // Log and reject
      logger.error("Error creating Supabase singleton:", error)
      reject(error)
    }
  })

  return initializationPromise
}

/**
 * Reset the Supabase singleton instance
 * Useful for testing or when auth state changes
 */
export function resetSupabaseSingleton(): void {
  logger.debug("Resetting Supabase singleton")

  // Clear the client and initialization state
  supabaseInstance = null
  isInitializing = false
  initializationPromise = null

  // Clear the GoTrueClient registry
  goTrueRegistry.clear()

  logger.debug("Supabase singleton reset complete")
}

/**
 * Get debug information about the singleton
 */
export function getSupabaseSingletonDebugInfo() {
  return {
    hasInstance: !!supabaseInstance,
    isInitializing,
    hasInitPromise: !!initializationPromise,
    instanceCount,
    goTrueClientCount: goTrueRegistry.size,
    lastInitTime,
  }
}

/**
 * Alias for getSupabaseSingleton to maintain compatibility with other modules
 */
export const getSupabaseClient = getSupabaseSingleton

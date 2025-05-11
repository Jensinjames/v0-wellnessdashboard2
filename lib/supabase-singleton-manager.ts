/**
 * Supabase Singleton Manager
 *
 * This module provides a true singleton pattern for Supabase client management
 * to prevent multiple GoTrueClient instances from being created.
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for Supabase operations
const logger = createLogger("SupabaseSingleton")

// Global singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null
let instanceCount = 0
let lastInitTime: number | null = null
let lastResetTime: number | null = null
let goTrueClientCount = 0

// Debug mode flag
const debugMode = process.env.NODE_ENV === "development"

// Registry to track GoTrueClient instances
const goTrueRegistry = new Set<any>()

/**
 * Get the Supabase client singleton
 * This ensures only one client instance is created per browser context
 */
export function getSupabaseClient(): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
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
      const newClient = createClientComponentClient<Database>({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        options: {
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
      })

      // Store the client
      supabaseInstance = newClient

      // Track the GoTrueClient instance
      if (newClient.auth && (newClient.auth as any)._goTrueClient) {
        const goTrueClient = (newClient.auth as any)._goTrueClient

        // Clear any existing instances before adding the new one
        goTrueRegistry.clear()
        goTrueRegistry.add(goTrueClient)
        goTrueClientCount = 1

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
export function resetSupabaseClient(): void {
  logger.debug("Resetting Supabase singleton")

  // Record reset time
  lastResetTime = Date.now()

  // Clear the client and initialization state
  supabaseInstance = null
  isInitializing = false
  initializationPromise = null

  // Clear the GoTrueClient registry
  goTrueRegistry.clear()
  goTrueClientCount = 0

  logger.debug("Supabase singleton reset complete")
}

/**
 * Add a listener for authentication state changes
 */
export function addAuthListener(callback: (event: string, session: Session | null) => void): () => void {
  const supabase = getSupabaseClient()

  // Handle both synchronous and asynchronous client retrieval
  const setupListener = (client: SupabaseClient<Database>) => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }

  if (supabase instanceof Promise) {
    // If the client is a promise, we need to wait for it to resolve
    let unsubscribe: (() => void) | null = null

    supabase
      .then((client) => {
        unsubscribe = setupListener(client)
      })
      .catch((error) => {
        logger.error("Error setting up auth listener:", error)
      })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  } else {
    // If the client is already available, set up the listener immediately
    return setupListener(supabase)
  }
}

/**
 * Get debug information about the singleton
 */
export function getSupabaseDebugInfo() {
  return {
    hasInstance: !!supabaseInstance,
    isInitializing,
    hasInitPromise: !!initializationPromise,
    instanceCount,
    goTrueClientCount: goTrueRegistry.size,
    lastInitTime,
    lastResetTime,
  }
}

/**
 * Check if the Supabase client is ready to use
 */
export async function isSupabaseClientReady(timeoutMs = 5000): Promise<boolean> {
  try {
    if (!supabaseInstance) {
      logger.debug("No Supabase client instance exists yet")
      return false
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error("Supabase client readiness check timed out")), timeoutMs)
    })

    // Try to make a simple request to check if the client is working
    const checkPromise = supabaseInstance.auth
      .getSession()
      .then(() => true)
      .catch((error) => {
        logger.debug("Supabase client readiness check failed:", error)
        return false
      })

    // Race the check against the timeout
    return await Promise.race([checkPromise, timeoutPromise])
  } catch (error) {
    logger.debug("Error checking if Supabase client is ready:", error)
    return false
  }
}

/**
 * Safely execute a database ping to warm up connections
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const client = await Promise.resolve(getSupabaseClient())
    // Use a simple query to warm up the connection
    const { error } = await client.from("profiles").select("count").limit(1)

    if (error) {
      logger.warn("Database ping failed:", error)
      return false
    }

    logger.debug("Database ping successful")
    return true
  } catch (error) {
    logger.warn("Database ping failed:", error)
    return false
  }
}

/**
 * Clean up any orphaned GoTrueClient instances
 */
export function cleanupOrphanedClients(): void {
  if (goTrueRegistry.size > 1) {
    logger.warn(`Cleaning up orphaned GoTrueClient instances. Before: ${goTrueRegistry.size}`)

    // Keep only the current client's GoTrueClient
    if (supabaseInstance && (supabaseInstance.auth as any)._goTrueClient) {
      const currentGoTrueClient = (supabaseInstance.auth as any)._goTrueClient
      goTrueRegistry.clear()
      goTrueRegistry.add(currentGoTrueClient)
      goTrueClientCount = 1
    } else {
      // If we don't have a current client, clear all
      goTrueRegistry.clear()
      goTrueClientCount = 0
    }

    logger.debug(`Cleanup complete. After: ${goTrueRegistry.size}`)
  }
}

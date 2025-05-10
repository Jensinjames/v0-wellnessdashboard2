import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("SupabaseSingleton")

// Global client instance
let supabaseInstance: SupabaseClient<Database> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null

/**
 * Get the Supabase client singleton
 * This ensures only one client instance is created per browser context
 */
export function getSupabaseClient(): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  // If we already have a client, return it
  if (supabaseInstance) {
    return supabaseInstance
  }

  // If we're already initializing, return the promise
  if (isInitializing && initializationPromise) {
    return initializationPromise
  }

  // Set initializing flag and create a promise
  isInitializing = true

  // Create a new initialization promise
  initializationPromise = new Promise<SupabaseClient<Database>>((resolve, reject) => {
    try {
      logger.debug("Creating new Supabase client instance")

      // Create the client with enhanced options
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
            storageKey: "wellness-dashboard-auth-v3",
          },
          global: {
            headers: {
              "x-application-name": "wellness-dashboard",
              "x-client-info": typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
            },
          },
        },
      })

      // Store the client
      supabaseInstance = newClient

      // Reset initialization state
      isInitializing = false

      // Resolve the promise with the client
      resolve(newClient)
    } catch (error) {
      // Reset initialization state
      isInitializing = false
      initializationPromise = null

      // Log and reject the promise
      logger.error("Error creating Supabase client:", error)
      reject(error)
    }
  })

  return initializationPromise
}

/**
 * Reset the client (useful for testing or when auth state changes)
 */
export function resetSupabaseClient() {
  logger.debug("Resetting Supabase client")
  supabaseInstance = null
  isInitializing = false
  initializationPromise = null
}

/**
 * Get the current client without creating a new one
 */
export function getCurrentClient(): SupabaseClient<Database> | null {
  return supabaseInstance
}

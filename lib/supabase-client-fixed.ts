import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global singleton instance
let supabaseClient: SupabaseClient<Database> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null

// Debug mode flag
const DEFAULT_DEBUG_MODE = process.env.NODE_ENV === "development"

/**
 * Get the Supabase client singleton
 * This ensures only one client instance is created per browser context
 */
export function getSupabaseClient(): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  if (typeof window === "undefined") {
    throw new Error("This client should only be used in the browser")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // If we already have a client, return it
  if (supabaseClient) {
    return supabaseClient
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
      console.log("[Supabase Client] Creating new client instance")

      // Create client options
      const clientOptions = {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          storageKey: "wellness-dashboard-auth-v2",
          debug: DEFAULT_DEBUG_MODE,
        },
        global: {
          headers: {
            "x-application-name": "wellness-dashboard",
          },
        },
      }

      // Create the client
      const newClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        clientOptions,
      )

      // Store the client
      supabaseClient = newClient

      // Reset initialization state
      isInitializing = false

      // Resolve the promise with the client
      resolve(newClient)
    } catch (error) {
      // Reset initialization state
      isInitializing = false
      initializationPromise = null

      // Log and reject the promise
      console.error("Error creating Supabase client:", error)
      reject(error)
    }
  })

  return initializationPromise
}

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseClient() {
  console.log("[Supabase Client] Resetting client")
  supabaseClient = null
  isInitializing = false
  initializationPromise = null
}

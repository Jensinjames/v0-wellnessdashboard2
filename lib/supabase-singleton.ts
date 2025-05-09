/**
 * Enhanced Supabase singleton client implementation
 * This ensures only one Supabase client is created and shared across the application
 */
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global singleton variables
let instance: SupabaseClient<Database> | null = null
let isInitializing = false
let initPromise: Promise<SupabaseClient<Database>> | null = null

/**
 * Get the Supabase client instance (singleton pattern)
 */
export function getSupabaseClient(
  options = {} as { forceNew?: boolean },
): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  // Early return if we already have an instance
  if (instance && !options.forceNew) {
    return instance
  }

  // If we're already initializing, return the promise
  if (isInitializing && initPromise && !options.forceNew) {
    return initPromise
  }

  // Set initializing flag
  isInitializing = true

  // Create initialization promise
  initPromise = new Promise((resolve, reject) => {
    try {
      // Check required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Missing required Supabase environment variables")
      }

      // Create the client
      const client = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
          },
        },
      )

      // Store the client in our singleton
      instance = client

      // Reset state and resolve
      isInitializing = false
      resolve(client)
    } catch (error) {
      // Reset state and reject
      isInitializing = false
      initPromise = null
      reject(error)
    }
  })

  return initPromise
}

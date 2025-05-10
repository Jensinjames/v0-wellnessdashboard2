/**
 * Supabase Client Singleton
 * Ensures only one client instance is created per browser context
 */

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { clientEnv, validateEnv } from "@/lib/env-config"

// Declare global type for the cached client
declare global {
  var __supabase: SupabaseClient<Database> | undefined
}

// Track client instances for debugging
let instanceCount = 0

/**
 * Returns the shared Supabase client.
 * - In the browser, reuses globalThis.__supabase
 * - On the server, always creates a fresh client
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // Validate environment variables
  if (!validateEnv()) {
    throw new Error("Missing required environment variables for Supabase client")
  }

  if (typeof window !== "undefined") {
    // Client-side: Use cached instance
    if (!globalThis.__supabase) {
      // Silent initialization - no console logs
      globalThis.__supabase = createClient<Database>(clientEnv.SUPABASE_URL!, clientEnv.SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          storageKey: "wellness-dashboard-auth-v3",
        },
      })

      instanceCount++
    }
    return globalThis.__supabase
  }

  // Server-side: Create a new client each time (no caching needed)
  // IMPORTANT: Only use the anon key on the server for client-equivalent operations
  // For admin operations, use a separate admin client with the service role key
  return createClient<Database>(clientEnv.SUPABASE_URL!, clientEnv.SUPABASE_ANON_KEY!)
}

/**
 * Reset the client (useful for testing)
 */
export function resetSupabaseClient(): void {
  if (typeof window !== "undefined") {
    globalThis.__supabase = undefined
  }
}

/**
 * Get debug info about the Supabase client
 */
export function getSupabaseSingletonDebugInfo() {
  return {
    instanceCount,
    hasActiveClient: typeof window !== "undefined" && !!globalThis.__supabase,
  }
}

// Alias for backward compatibility
export const getSupabaseSingleton = getSupabaseClient
export const resetSupabaseSingleton = resetSupabaseClient

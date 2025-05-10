import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("SupabaseClient")

declare global {
  // Tell TypeScript about our global cache
  var __supabase: SupabaseClient<Database> | undefined
}

/**
 * Returns a shared Supabase client.
 * - In browser: reuse `globalThis.__supabase`.
 * - On server: create a new client.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // Client-side: reuse or create once
  if (typeof window !== "undefined") {
    if (!globalThis.__supabase) {
      logger.debug("Creating new Supabase client instance")

      globalThis.__supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
              "x-client-info": window.navigator.userAgent,
            },
          },
        },
      )
    }
    return globalThis.__supabase
  }

  // Server-side: always fresh
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "wellness-dashboard-server",
      },
    },
  })
}

/**
 * Reset the client (useful for testing or when auth state changes)
 */
export function resetSupabaseClient() {
  if (typeof window !== "undefined" && globalThis.__supabase) {
    logger.debug("Resetting Supabase client")

    // Clean up any listeners
    try {
      const { data } = globalThis.__supabase.auth.onAuthStateChange(() => {})
      if (data && typeof data.subscription?.unsubscribe === "function") {
        data.subscription.unsubscribe()
      }
    } catch (e) {
      logger.error("Error cleaning up Supabase client:", e)
    }

    globalThis.__supabase = undefined
  }
}

/**
 * Get the current client without creating a new one
 */
export function getCurrentClient(): SupabaseClient<Database> | null {
  if (typeof window !== "undefined") {
    return globalThis.__supabase || null
  }
  return null
}

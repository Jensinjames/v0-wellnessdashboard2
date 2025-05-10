import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Define a safe global store that works in both browser and server environments
declare global {
  // For browser environments
  interface Window {
    __supabase: SupabaseClient<Database> | undefined
  }

  // For server environments (Node.js)
  var __supabase: SupabaseClient<Database> | undefined
}

/**
 * Gets a singleton Supabase client instance
 * Uses window.__supabase in browser environments
 * Falls back to global.__supabase in server environments
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    // Browser environment - store on window
    if (!window.__supabase) {
      window.__supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
            storageKey: "wellness-dashboard-auth-v3",
          },
        },
      )
    }
    return window.__supabase
  }

  // Server-side environment - use Node.js global
  if (typeof global !== "undefined") {
    if (!global.__supabase) {
      global.__supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    }
    return global.__supabase
  }

  // Fallback - create a new client each time (should never happen)
  console.warn("Creating non-singleton Supabase client - this should not happen")
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

/**
 * Resets the Supabase client singleton instance
 * Useful for testing or after sign-out
 */
export function resetSupabaseClient(): void {
  if (typeof window !== "undefined") {
    window.__supabase = undefined
  } else if (typeof global !== "undefined") {
    global.__supabase = undefined
  }
}

/**
 * Checks the connection to Supabase
 * Returns whether connected successfully and the connection latency
 */
export async function checkSupabaseConnection(): Promise<{ isConnected: boolean; latency: number }> {
  try {
    const startTime = Date.now()
    const client = getSupabaseClient()

    // Simple query to check connection
    const { data, error } = await client.from("profiles").select("id").limit(1).maybeSingle()

    const endTime = Date.now()
    const latency = endTime - startTime

    return {
      isConnected: !error,
      latency,
    }
  } catch (err) {
    console.error("Error checking Supabase connection:", err)
    return {
      isConnected: false,
      latency: -1,
    }
  }
}

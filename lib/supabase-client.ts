/**
 * Supabase Client
 * Client-side Supabase client with proper authentication handling
 */
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { isDebugMode } from "@/utils/environment"

// Singleton instance for the client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Create and return a Supabase client for browser usage
export function getSupabaseClient(): ReturnType<typeof createBrowserClient<Database>> {
  if (!supabaseClient) {
    try {
      // Check if required environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Missing Supabase environment variables")
        throw new Error("Supabase configuration is missing. Please check your environment variables.")
      }

      // Create a new client if one doesn't exist - ONLY use anon key on client side
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
            },
          },
        },
      )

      if (isDebugMode()) {
        console.log("Supabase client created successfully")
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      throw error
    }
  }

  return supabaseClient
}

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseClient() {
  supabaseClient = null
}

// Get the current auth state
export async function getCurrentSession() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error("Error getting session:", error)
    return { session: null, error }
  }

  return { session: data.session, error: null }
}

// Get the current user
export async function getCurrentUser() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user:", error)
      return { user: null, error }
    }

    if (!data?.user) {
      return { user: null, error: new Error("No user data returned") }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Unexpected error getting user:", error)
    return { user: null, error }
  }
}

/**
 * Monitor GoTrue client instances for debugging purposes
 * This helps track authentication client instances to prevent memory leaks
 */
export function monitorGoTrueClientInstances() {
  if (!isDebugMode()) return { start: () => {}, stop: () => {} }

  let intervalId: NodeJS.Timeout | null = null
  const instanceCounts = new Map<string, number>()

  const start = () => {
    if (intervalId) return

    // Check for GoTrue instances in global scope (for debugging only)
    intervalId = setInterval(() => {
      try {
        // This is a simplified version that just logs the client instance
        if (supabaseClient) {
          const clientId = (supabaseClient as any)?.auth?.id || "unknown"
          const count = instanceCounts.get(clientId) || 0
          instanceCounts.set(clientId, count + 1)

          console.debug(`[Auth Monitor] Active GoTrue client: ${clientId}`)
        }
      } catch (err) {
        console.error("[Auth Monitor] Error monitoring GoTrue instances:", err)
      }
    }, 30000) // Check every 30 seconds
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return { start, stop }
}

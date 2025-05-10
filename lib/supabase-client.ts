/**
 * Supabase Client
 * Singleton implementation with proper cleanup and error handling
 */
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseClient")

// Global singleton instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null
let clientId = `client-${Date.now()}`
let authSubscription: { unsubscribe: () => void } | null = null

/**
 * Get the Supabase client for browser usage
 * Uses singleton pattern to prevent multiple instances
 */
export function getSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (!supabaseClient) {
    try {
      // Check if required environment variables are available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        const error = new Error(
          `Supabase configuration is missing. URL: ${supabaseUrl ? "defined" : "undefined"}, Key: ${
            supabaseKey ? "defined" : "undefined"
          }`,
        )
        logger.error("Configuration error:", error)
        throw error
      }

      logger.info(`Creating new Supabase client (${clientId})`)

      // Create a new client if one doesn't exist
      supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
        global: {
          headers: {
            "x-client-id": clientId,
            "x-client-info": `wellness-dashboard/${process.env.NEXT_PUBLIC_APP_VERSION || "unknown"}`,
          },
        },
      })

      // Set up auth state change listener for debugging
      if (process.env.NODE_ENV !== "production") {
        authSubscription = supabaseClient.auth.onAuthStateChange((event) => {
          logger.info(`Auth state changed: ${event} (client: ${clientId})`)
        }).data.subscription
      }
    } catch (error) {
      logger.error("Error creating Supabase client:", error)
      throw error
    }
  }

  return supabaseClient
}

/**
 * Reset the client (useful for testing or when auth state changes)
 * Ensures proper cleanup of subscriptions
 */
export function resetSupabaseClient() {
  if (authSubscription) {
    logger.info(`Unsubscribing from auth events (client: ${clientId})`)
    authSubscription.unsubscribe()
    authSubscription = null
  }

  logger.info(`Resetting Supabase client (${clientId})`)
  supabaseClient = null
  clientId = `client-${Date.now()}`
}

/**
 * Get the current auth state
 */
export async function getCurrentSession() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      logger.error("Error getting session:", error)
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (error) {
    logger.error("Unexpected error getting session:", error)
    return { session: null, error }
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  try {
    const supabase = getSupabaseClient()
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

// For backward compatibility
export function setDebugMode(): void {
  // Empty function for backward compatibility
}

export function getConnectionHealth(): any {
  return {
    isHealthy: !!supabaseClient,
    clientId,
  }
}

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("profiles").select("id").limit(1)
    return !error
  } catch (error) {
    logger.error("Connection check failed:", error)
    return false
  }
}

export function getCurrentClient(): any {
  return supabaseClient
}

export function cleanupOrphanedClients(): number {
  if (authSubscription) {
    authSubscription.unsubscribe()
    authSubscription = null
  }
  return 0
}

export function monitorGoTrueClientInstances(): any {
  return {
    start: () => {},
    stop: () => {},
  }
}

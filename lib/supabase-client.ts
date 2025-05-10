/**
 * Supabase Client
 * Client-side Supabase client with proper authentication handling
 */
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { CLIENT_ENV, validateClientEnv } from "@/lib/env-config"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseClient")

// Track all client instances for debugging
const clientInstances = new Map<string, any>()

// Singleton instance for the client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null
let clientId = `supabase-client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

// Create and return a Supabase client for browser usage
export function getSupabaseClient(): ReturnType<typeof createBrowserClient<Database>> {
  if (!supabaseClient) {
    try {
      // Validate environment variables
      const { valid, missing } = validateClientEnv()
      if (!valid) {
        logger.error(`Missing Supabase environment variables: ${missing.join(", ")}`)
        throw new Error("Supabase configuration is missing. Please check your environment variables.")
      }

      // Create a new client if one doesn't exist - ONLY use anon key on client side
      const url = CLIENT_ENV.SUPABASE_URL
      const key = CLIENT_ENV.SUPABASE_ANON_KEY

      if (!url || !key) {
        throw new Error("Supabase URL or Anon Key is missing")
      }

      // Generate a consistent storage key based on the URL
      const storageKey = `sb-${url.replace(/^https?:\/\//, "").replace(/\..*$/, "")}-auth`

      supabaseClient = createBrowserClient<Database>(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          storageKey,
        },
        global: {
          headers: {
            "x-application-name": "wellness-dashboard-client",
            "x-client-id": clientId,
          },
        },
      })

      // Track this instance for debugging
      clientInstances.set(clientId, {
        createdAt: new Date().toISOString(),
        url,
      })

      if (CLIENT_ENV.DEBUG_MODE) {
        logger.info(`Supabase client created successfully (${clientId})`)
        logger.debug(`Active client instances: ${clientInstances.size}`)
      }
    } catch (error) {
      logger.error("Error initializing Supabase client:", error)
      throw error
    }
  }

  return supabaseClient
}

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseClient() {
  if (supabaseClient) {
    logger.info(`Resetting Supabase client (${clientId})`)

    // Remove from tracking
    clientInstances.delete(clientId)

    // Reset the client
    supabaseClient = null
    clientId = `supabase-client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  }
}

// Get the current auth state
export async function getCurrentSession() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    logger.error("Error getting session:", error)
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

/**
 * Monitor GoTrue client instances for debugging purposes
 * This helps track authentication client instances to prevent memory leaks
 */
export function monitorGoTrueClientInstances() {
  if (!CLIENT_ENV.DEBUG_MODE) return { start: () => {}, stop: () => {} }

  let intervalId: NodeJS.Timeout | null = null

  const start = () => {
    if (intervalId) return

    // Check for GoTrue instances in global scope (for debugging only)
    intervalId = setInterval(() => {
      try {
        logger.debug(`[Auth Monitor] Active client instances: ${clientInstances.size}`)

        // Log each active instance
        clientInstances.forEach((instance, id) => {
          logger.debug(`[Auth Monitor] Instance ${id} created at ${instance.createdAt}`)
        })
      } catch (err) {
        logger.error("[Auth Monitor] Error monitoring GoTrue instances:", err)
      }
    }, 60000) // Check every minute

    logger.info("[Auth Monitor] Started monitoring GoTrue instances")
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
      logger.info("[Auth Monitor] Stopped monitoring GoTrue instances")
    }
  }

  return { start, stop }
}

// Get all active client instances (for debugging)
export function getClientInstances() {
  return Array.from(clientInstances.entries()).map(([id, instance]) => ({
    id,
    ...instance,
  }))
}

// Clear all client instances except the current one
export function clearOtherClientInstances() {
  clientInstances.forEach((_, id) => {
    if (id !== clientId) {
      clientInstances.delete(id)
    }
  })

  logger.info(`Cleared other client instances. Active count: ${clientInstances.size}`)
}

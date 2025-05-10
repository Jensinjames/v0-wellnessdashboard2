/**
 * Supabase Client
 * Client-side Supabase client with proper authentication handling
 */
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { isDebugMode } from "@/utils/environment"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseClient")

// Debug mode flag
let debugMode = false

/**
 * Set debug mode for Supabase client
 */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled
  logger.info(`Supabase client debug mode ${enabled ? "enabled" : "disabled"}`)
}

// Track all client instances for debugging
const clientInstances = new Map<string, any>()

// Singleton instance for the client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null
let clientId = `supabase-client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

// Connection health status
let connectionHealth = {
  lastChecked: 0,
  isHealthy: true,
  errorCount: 0,
  lastError: null as Error | null,
}

/**
 * Create and return a Supabase client for browser usage
 */
export function getSupabaseClient(): ReturnType<typeof createBrowserClient<Database>> {
  if (!supabaseClient) {
    try {
      // Check if required environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        logger.error("Missing Supabase environment variables")
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
              "x-client-id": clientId,
            },
          },
        },
      )

      // Track this instance for debugging
      clientInstances.set(clientId, {
        createdAt: new Date().toISOString(),
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      })

      if (isDebugMode() || debugMode) {
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

/**
 * Reset the client (useful for testing or when auth state changes)
 */
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

/**
 * Get the current auth state
 */
export async function getCurrentSession() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    logger.error("Error getting session:", error)
    return { session: null, error }
  }

  return { session: data.session, error: null }
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

/**
 * Monitor GoTrue client instances for debugging purposes
 * This helps track authentication client instances to prevent memory leaks
 */
export function monitorGoTrueClientInstances() {
  if (!isDebugMode() && !debugMode) return { start: () => {}, stop: () => {} }

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

/**
 * Get the current Supabase client instance
 */
export function getCurrentClient() {
  return supabaseClient
}

/**
 * Clean up orphaned client instances
 */
export function cleanupOrphanedClients() {
  const now = Date.now()
  let count = 0

  clientInstances.forEach((instance, id) => {
    const createdAt = new Date(instance.createdAt).getTime()
    // If instance is older than 1 hour and not the current one
    if (now - createdAt > 3600000 && id !== clientId) {
      clientInstances.delete(id)
      count++
    }
  })

  logger.info(`Cleaned up ${count} orphaned client instances`)
  return count
}

/**
 * Check Supabase connection health
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const start = Date.now()

    // Simple health check query
    const { error } = await supabase.from("profiles").select("id").limit(1)

    const duration = Date.now() - start

    if (error) {
      connectionHealth = {
        lastChecked: Date.now(),
        isHealthy: false,
        errorCount: connectionHealth.errorCount + 1,
        lastError: error,
      }
      logger.error(`Supabase connection check failed (${duration}ms):`, error)
      return false
    }

    connectionHealth = {
      lastChecked: Date.now(),
      isHealthy: true,
      errorCount: 0,
      lastError: null,
    }

    logger.debug(`Supabase connection check successful (${duration}ms)`)
    return true
  } catch (error) {
    connectionHealth = {
      lastChecked: Date.now(),
      isHealthy: false,
      errorCount: connectionHealth.errorCount + 1,
      lastError: error instanceof Error ? error : new Error(String(error)),
    }
    logger.error("Supabase connection check error:", error)
    return false
  }
}

/**
 * Get connection health status
 */
export function getConnectionHealth() {
  return connectionHealth
}

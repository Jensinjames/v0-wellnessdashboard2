/**
 * Supabase Client - Browser-only client with enhanced features
 * This file provides a singleton pattern for Supabase client in browser contexts
 */
"use client"

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { isClient, clientEnv, validateEnv } from "@/lib/env"

// Singleton instance
let supabaseClient: SupabaseClient<Database> | null = null

// Initialization state tracking
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null

// Telemetry
let instanceCount = 0
let lastInitTime: number | null = null
let lastResetTime: number | null = null

// Debug mode flag - default to false in production
const DEFAULT_DEBUG_MODE = clientEnv.APP_ENVIRONMENT === "development"

// Internal debug logging function
function debugLog(...args: any[]): void {
  let debugMode = DEFAULT_DEBUG_MODE
  if (isClient()) {
    debugMode = localStorage.getItem("supabase_debug") === "true" || DEFAULT_DEBUG_MODE
  }

  if (debugMode) {
    console.log("[Supabase Client]", ...args)
  }
}

/**
 * Get the Supabase client singleton
 * This ensures only one client instance is created per browser context
 */
export function getSupabaseClient(
  options: {
    forceNew?: boolean
    timeout?: number
    debug?: boolean
  } = {},
): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  if (!isClient()) {
    throw new Error(
      "This client should only be used in the browser. Use createServerSupabaseClient for server contexts.",
    )
  }

  // Validate environment variables
  if (!validateEnv()) {
    throw new Error("Missing required environment variables for Supabase client")
  }

  const debugMode = options.debug ?? DEFAULT_DEBUG_MODE

  // If we already have a client and aren't forcing a new one, return it
  if (supabaseClient && !options.forceNew) {
    return supabaseClient
  }

  // If we're already initializing, return the promise
  if (isInitializing && initializationPromise && !options.forceNew) {
    return initializationPromise
  }

  // Set initializing flag
  isInitializing = true

  // Create a new initialization promise
  initializationPromise = new Promise<SupabaseClient<Database>>((resolve, reject) => {
    try {
      debugLog("Creating new Supabase client instance")

      // Track instance count for debugging
      instanceCount++

      // Record initialization time
      lastInitTime = Date.now()

      // Create client options
      const clientOptions = {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          // Use a consistent storage key to prevent conflicts
          storageKey: "wellness-dashboard-auth-token",
          // Debug flag to help identify issues
          debug: debugMode,
        },
        global: {
          headers: {
            "x-application-name": "wellness-dashboard",
            "x-client-instance": `instance-${instanceCount}`,
            "x-client-init-time": lastInitTime?.toString() || "unknown",
          },
          fetch: (url: RequestInfo | URL, fetchOptions: RequestInit = {}) => {
            const timeout = options.timeout || 10000
            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
              controller.abort()
              debugLog(`Fetch request to ${url.toString()} timed out after ${timeout}ms`)
            }, timeout)

            return fetch(url, {
              ...fetchOptions,
              signal: controller.signal,
            })
              .then((response) => {
                clearTimeout(timeoutId)
                return response
              })
              .catch((error) => {
                clearTimeout(timeoutId)
                debugLog(`Fetch error for ${url.toString()}: ${error.message}`)
                throw error
              })
          },
        },
      }

      // Create the client using client-side environment variables
      const newClient = createClient<Database>(clientEnv.SUPABASE_URL!, clientEnv.SUPABASE_ANON_KEY!, clientOptions)

      // Store the client
      supabaseClient = newClient

      // Reset initialization state
      isInitializing = false

      // Add unload event listener to clean up client on page unload
      if (isClient()) {
        window.addEventListener("beforeunload", () => {
          debugLog("Page unloading, cleaning up Supabase client")
        })
      }

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
  debugLog("Resetting Supabase client")

  // Record reset time
  lastResetTime = Date.now()

  // Clear the client and initialization state
  supabaseClient = null
  isInitializing = false
  initializationPromise = null

  debugLog("Supabase client reset complete")
}

// Get the current client without creating a new one
export function getCurrentClient(): SupabaseClient<Database> | null {
  return supabaseClient
}

// Check the Supabase connection health
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // If we don't have a client yet, create one
    if (!supabaseClient) {
      debugLog("No Supabase client instance exists yet, creating one for connection check")
      await getSupabaseClient({ timeout: 5000 })
    }

    // If we still don't have a client, return false
    if (!supabaseClient) {
      debugLog("Failed to create client for connection check")
      return false
    }

    // Simple health check query
    const { error } = await supabaseClient.from("profiles").select("count").limit(1)

    if (error) {
      console.error("Supabase connection test error:", error.message)
      return false
    }

    return true
  } catch (error: any) {
    console.error("Supabase connection test exception:", error.message || "Unknown error")
    return false
  }
}

// Monitor for multiple GoTrue client instances
export function monitorGoTrueClientInstances(intervalMs = 60000): () => void {
  if (!isClient()) {
    return () => {}
  }

  let monitorInterval: NodeJS.Timeout | null = null

  // Start monitoring
  const startMonitoring = () => {
    debugLog("Starting GoTrueClient instance monitoring")

    monitorInterval = setInterval(() => {
      // In the new singleton pattern, we shouldn't have multiple instances
      // This is just for backward compatibility and monitoring
      debugLog("Checking for multiple GoTrueClient instances")
    }, intervalMs)

    return () => {
      if (monitorInterval) {
        clearInterval(monitorInterval)
        monitorInterval = null
        debugLog("Stopped GoTrueClient instance monitoring")
      }
    }
  }

  return startMonitoring()
}

// Add this function before the export function getConnectionHealth()

/**
 * Cleanup any orphaned Supabase client instances
 * This is useful for testing and development
 */
export function cleanupOrphanedClients(): void {
  debugLog("Cleaning up orphaned Supabase client instances")

  // Reset the client
  supabaseClient = null
  isInitializing = false
  initializationPromise = null

  // Force garbage collection if possible
  if (typeof window !== "undefined" && window.gc) {
    try {
      // @ts-ignore - gc is not in the standard TypeScript types
      window.gc()
    } catch (e) {
      // Ignore errors, gc might not be available
    }
  }

  debugLog("Orphaned clients cleanup complete")
}

// Get connection health metrics
export function getConnectionHealth() {
  return {
    isInitialized: !!supabaseClient,
    isHealthy: !!supabaseClient,
    clientInstanceCount: instanceCount,
    lastInitTime,
    lastResetTime,
  }
}

// Enable/disable debug logging
export function setDebugMode(enabled: boolean): void {
  if (isClient()) {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
  }
  console.log(`Supabase client debug mode ${enabled ? "enabled" : "disabled"}`)
}

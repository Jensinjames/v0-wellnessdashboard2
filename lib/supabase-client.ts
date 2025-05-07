import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { isDebugMode, isClient } from "@/utils/environment"

// Global variables for singleton pattern
let supabaseClient: SupabaseClient<Database> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null
let clientInitTime: number | null = null
let clientInstanceCount = 0
let lastResetTime: number | null = null

// Debug mode flag - default to false in production
const DEFAULT_DEBUG_MODE = false

// Global registry to track all GoTrueClient instances
const goTrueClientRegistry = new Set<any>()

// Enable/disable debug logging
export function setDebugMode(enabled: boolean): void {
  if (isClient()) {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
  }
  console.log(`Supabase client debug mode ${enabled ? "enabled" : "disabled"}`)
}

// Internal debug logging function
function debugLog(...args: any[]): void {
  // Read from localStorage to allow dynamic toggling
  let debugMode = DEFAULT_DEBUG_MODE
  if (isClient()) {
    debugMode = localStorage.getItem("supabase_debug") === "true"

    // Use NEXT_PUBLIC prefixed variable for debug mode
    if (isDebugMode()) {
      debugMode = true
    }
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
  } = {},
): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  if (!isClient()) {
    throw new Error("This client should only be used in the browser")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // If we already have a client and aren't forcing a new one, return it
  if (supabaseClient && !options.forceNew) {
    // Check if the auth object exists and has the expected methods
    if (!supabaseClient.auth || typeof supabaseClient.auth.resetPasswordForEmail !== "function") {
      debugLog("Existing client is invalid, creating a new one")
      resetSupabaseClient()
    } else {
      debugLog("Returning existing Supabase client instance")
      return supabaseClient
    }
  }

  // If we're already initializing, return the promise
  if (isInitializing && initializationPromise && !options.forceNew) {
    debugLog("Client initialization already in progress, returning promise")
    return initializationPromise
  }

  // Set initializing flag and create a promise
  isInitializing = true

  // Create a new initialization promise
  initializationPromise = new Promise<SupabaseClient<Database>>((resolve, reject) => {
    try {
      debugLog("Creating new Supabase client instance")

      // Track instance count for debugging
      clientInstanceCount++

      // Record initialization time
      clientInitTime = Date.now()

      // Create client options
      const clientOptions = {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          // Use a consistent storage key to prevent conflicts
          storageKey: "wellness-dashboard-auth-v2",
          // Debug flag to help identify issues - read from localStorage
          debug: isClient() ? localStorage.getItem("supabase_debug") === "true" : DEFAULT_DEBUG_MODE,
          // Storage event listener to sync auth state across tabs
          storage: {
            getItem: (key: string) => {
              try {
                return localStorage.getItem(key)
              } catch (error) {
                console.error("Error accessing localStorage:", error)
                return null
              }
            },
            setItem: (key: string, value: string) => {
              try {
                localStorage.setItem(key, value)
              } catch (error) {
                console.error("Error writing to localStorage:", error)
              }
            },
            removeItem: (key: string) => {
              try {
                localStorage.removeItem(key)
              } catch (error) {
                console.error("Error removing from localStorage:", error)
              }
            },
          },
        },
        global: {
          headers: {
            "x-application-name": "wellness-dashboard",
            "x-client-instance": `instance-${clientInstanceCount}`,
            "x-client-init-time": clientInitTime?.toString() || "unknown",
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
                // Rethrow the error to be handled by the caller
                throw error
              })
          },
        },
      }

      // Create the client
      const newClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        clientOptions,
      )

      // Before storing the new client, clean up any existing GoTrueClient instances
      cleanupOrphanedClients()

      // Store the client
      supabaseClient = newClient

      // Track the GoTrueClient instance
      if (newClient.auth && (newClient.auth as any)._goTrueClient) {
        // Add the new instance
        goTrueClientRegistry.add((newClient.auth as any)._goTrueClient)
        debugLog(`Registered GoTrueClient instance. Total instances: ${goTrueClientRegistry.size}`)

        // If we have multiple instances, log a warning
        if (goTrueClientRegistry.size > 1) {
          console.warn(
            `[CRITICAL] Multiple GoTrueClient instances detected (${goTrueClientRegistry.size}). ` +
              `This may lead to undefined behavior. Please ensure only one instance is created.`,
          )

          // Force cleanup of orphaned instances
          cleanupOrphanedClients(true)
        }
      }

      // Reset initialization state
      isInitializing = false

      // Add unload event listener to clean up client on page unload
      if (isClient()) {
        window.addEventListener("beforeunload", () => {
          debugLog("Page unloading, cleaning up Supabase client")
          cleanupOrphanedClients(true)
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

// Test the Supabase connection
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // If we don't have a client yet, create one
    if (!supabaseClient) {
      debugLog("No client exists, creating one for connection check")
      await getSupabaseClient()
    }

    // If we still don't have a client, return false
    if (!supabaseClient) {
      debugLog("Failed to create client for connection check")
      return false
    }

    const { data, error } = await supabaseClient.auth.getSession()

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

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseClient() {
  debugLog("Resetting Supabase client")

  // Record reset time
  lastResetTime = Date.now()

  // Clean up any event listeners or timers associated with the client
  if (supabaseClient && (supabaseClient as any)._closeChannel) {
    try {
      ;(supabaseClient as any)._closeChannel()
    } catch (e) {
      debugLog("Error closing realtime channel:", e)
    }
  }

  // Clear the client and initialization state
  supabaseClient = null
  isInitializing = false
  initializationPromise = null

  // Clear the GoTrueClient registry
  goTrueClientRegistry.clear()

  debugLog("Supabase client reset complete")
}

// Get the current client without creating a new one
export function getCurrentClient(): SupabaseClient<Database> | null {
  return supabaseClient
}

// Get connection health
export function getConnectionHealth() {
  return {
    isInitialized: !!supabaseClient,
    isHealthy: checkSupabaseConnection(),
    lastSuccessfulConnection: Date.now(),
    connectionAttempts: 0,
    clientInstanceCount,
    goTrueClientCount: goTrueClientRegistry.size,
    clientInitTime,
    lastResetTime,
  }
}

// Check if the Supabase client is ready to use
export async function isSupabaseClientReady(timeoutMs = 5000): Promise<boolean> {
  try {
    if (!supabaseClient) {
      debugLog("No Supabase client instance exists yet")
      return false
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error("Supabase client readiness check timed out")), timeoutMs)
    })

    // Try to make a simple request to check if the client is working
    const checkPromise = supabaseClient.auth
      .getSession()
      .then(() => true)
      .catch((error) => {
        debugLog("Supabase client readiness check failed:", error)
        return false
      })

    // Race the check against the timeout
    return await Promise.race([checkPromise, timeoutPromise])
  } catch (error) {
    debugLog("Error checking if Supabase client is ready:", error)
    return false
  }
}

// Get debug information about the client
export function getClientDebugInfo() {
  return {
    hasClient: !!supabaseClient,
    isInitializing,
    hasInitPromise: !!initializationPromise,
    clientInstanceCount,
    goTrueClientCount: goTrueClientRegistry.size,
    clientInitTime,
    lastResetTime,
    storageKeys:
      typeof window !== "undefined"
        ? Object.keys(localStorage).filter((key) => key.includes("supabase") || key.includes("auth"))
        : [],
  }
}

// Clear any orphaned GoTrueClient instances
export function cleanupOrphanedClients(forceCleanup = false) {
  if (goTrueClientRegistry.size > 1 || forceCleanup) {
    debugLog(`Cleaning up orphaned GoTrueClient instances. Before: ${goTrueClientRegistry.size}`)

    // Keep only the current client's GoTrueClient
    if (supabaseClient && (supabaseClient.auth as any)._goTrueClient) {
      const currentGoTrueClient = (supabaseClient.auth as any)._goTrueClient
      goTrueClientRegistry.clear()
      goTrueClientRegistry.add(currentGoTrueClient)
    } else {
      // If we don't have a current client, clear all
      goTrueClientRegistry.clear()
    }

    debugLog(`Cleanup complete. After: ${goTrueClientRegistry.size}`)

    // Force garbage collection if possible
    if (typeof window !== "undefined" && (window as any).gc) {
      try {
        ;(window as any).gc()
      } catch (e) {
        // Ignore if gc is not available
      }
    }
  }
}

// Add a function to detect and fix GoTrueClient leaks
export function monitorGoTrueClientInstances(intervalMs = 60000): () => void {
  if (typeof window === "undefined") return () => {}

  const intervalId = setInterval(() => {
    if (goTrueClientRegistry.size > 1) {
      console.warn(`[MONITOR] Detected ${goTrueClientRegistry.size} GoTrueClient instances. Cleaning up...`)
      cleanupOrphanedClients(true)
    }
  }, intervalMs)

  // Return a function to stop monitoring
  return () => clearInterval(intervalId)
}

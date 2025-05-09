import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global variables for singleton pattern
let supabaseClient: SupabaseClient<Database> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null
let clientInitTime: number | null = null
let clientInstanceCount = 0
let lastResetTime: number | null = null

// Global registry to track all GoTrueClient instances
const goTrueClientRegistry = new Set<any>()

// Declare debugLog variable
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.debug(message, ...args)
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
  if (typeof window === "undefined") {
    throw new Error("This client should only be used in the browser")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // If we already have a client and aren't forcing a new one, return it
  if (supabaseClient && !options.forceNew) {
    // Check if the auth object exists and has the expected methods
    if (!supabaseClient.auth || typeof supabaseClient.auth.signInWithPassword !== "function") {
      console.warn("Existing client is invalid, creating a new one")
      resetSupabaseClient()
    } else {
      return supabaseClient
    }
  }

  // If we're already initializing, return the promise
  if (isInitializing && initializationPromise && !options.forceNew) {
    return initializationPromise
  }

  // Set initializing flag and create a promise
  isInitializing = true

  // Create a new initialization promise
  initializationPromise = new Promise<SupabaseClient<Database>>((resolve, reject) => {
    try {
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
      }

      // Reset initialization state
      isInitializing = false

      // Add unload event listener to clean up client on page unload
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", () => {
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
      await getSupabaseClient()
    }

    // If we still don't have a client, return false
    if (!supabaseClient) {
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
  // Record reset time
  lastResetTime = Date.now()

  // Clean up any event listeners or timers associated with the client
  if (supabaseClient && (supabaseClient as any)._closeChannel) {
    try {
      ;(supabaseClient as any)._closeChannel()
    } catch (e) {
      console.error("Error closing realtime channel:", e)
    }
  }

  // Clear the client and initialization state
  supabaseClient = null
  isInitializing = false
  initializationPromise = null

  // Clear the GoTrueClient registry
  goTrueClientRegistry.clear()
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
    // Keep only the current client's GoTrueClient
    if (supabaseClient && (supabaseClient.auth as any)._goTrueClient) {
      const currentGoTrueClient = (supabaseClient.auth as any)._goTrueClient
      goTrueClientRegistry.clear()
      goTrueClientRegistry.add(currentGoTrueClient)
    } else {
      // If we don't have a current client, clear all
      goTrueClientRegistry.clear()
    }

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

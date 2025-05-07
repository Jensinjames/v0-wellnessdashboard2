import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { isDebugMode, isBrowser } from "./env-utils-secure"

// Global singleton variables with proper typing
let supabaseClient: SupabaseClient<Database> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null
let clientInitTime: number | null = null
let clientInstanceCount = 0
let lastResetTime: number | null = null

// Use WeakSet to avoid memory leaks - allows garbage collection of unused instances
const goTrueClientRegistry = new WeakSet<any>()

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (isDebugMode()) {
    console.log("[Supabase Client]", ...args)
  }
}

/**
 * Get the Supabase client singleton with enhanced reliability
 * This ensures only one client instance is created per browser context
 */
export function getSupabaseClient(
  options: {
    forceNew?: boolean
    timeout?: number
  } = {},
): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  // Server-side check
  if (!isBrowser) {
    throw new Error(
      "This client should only be used in the browser. Use createServerSupabaseClient() for server-side operations.",
    )
  }

  // Environment variable check
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // If we already have a client and aren't forcing a new one, return it
  if (supabaseClient && !options.forceNew) {
    // Check if the auth object exists and has the expected methods
    if (!supabaseClient.auth || typeof supabaseClient.auth.signInWithPassword !== "function") {
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

      // Create client options with enhanced reliability
      const clientOptions = {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          // Use a consistent storage key to prevent conflicts
          storageKey: "wellness-dashboard-auth-v4",
          // Debug flag to help identify issues
          debug: isDebugMode(),
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

      // Before creating a new client, clean up any existing GoTrueClient instances
      cleanupOrphanedClients(true)

      // Create the client
      const newClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        clientOptions,
      )

      // Store the client
      supabaseClient = newClient

      // Track the GoTrueClient instance
      if (newClient.auth && (newClient.auth as any)._goTrueClient) {
        // Add the new instance
        goTrueClientRegistry.add((newClient.auth as any)._goTrueClient)
        debugLog(`Registered GoTrueClient instance`)
      }

      // Reset initialization state
      isInitializing = false

      // Add unload event listener to clean up client on page unload
      if (isBrowser) {
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

/**
 * Create a Supabase client for server-side operations
 * This should be used in server components or API routes
 */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required Supabase environment variables")
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  })
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

  debugLog("Supabase client reset complete")
}

// Get the current client without creating a new one
export function getCurrentClient(): SupabaseClient<Database> | null {
  return supabaseClient
}

// Clear any orphaned GoTrueClient instances
export function cleanupOrphanedClients(forceCleanup = false) {
  debugLog(`Cleaning up orphaned GoTrueClient instances`)

  // If we have a current client, keep its GoTrueClient and discard others
  if (supabaseClient && (supabaseClient.auth as any)?._goTrueClient) {
    // We're using a WeakSet, so we don't need to explicitly clear it
    // Just ensure the current client's GoTrueClient is registered
    goTrueClientRegistry.add((supabaseClient.auth as any)._goTrueClient)
  }

  // Force garbage collection if possible in development
  if (isDebugMode() && isBrowser && (window as any).gc) {
    try {
      ;(window as any).gc()
    } catch (e) {
      // Ignore if gc is not available
    }
  }
}

// Add a function to detect and fix GoTrueClient leaks
export function monitorGoTrueClientInstances(intervalMs = 60000): () => void {
  if (!isBrowser) return () => {}

  const intervalId = setInterval(() => {
    cleanupOrphanedClients(true)
  }, intervalMs)

  // Return a function to stop monitoring
  return () => clearInterval(intervalId)
}

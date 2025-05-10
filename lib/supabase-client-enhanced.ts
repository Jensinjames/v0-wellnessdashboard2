import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Global variables for singleton pattern
let supabaseClient: SupabaseClient<Database> | ReturnType<typeof createClientComponentClient<Database>> | null = null
let isInitializing = false
let initializationPromise: Promise<SupabaseClient<Database>> | null = null
let clientInitTime: number | null = null
let clientInstanceCount = 0
let lastResetTime = Date.now()
let lastSuccessfulConnection: number | null = null
let connectionAttempts = 0
let consecutiveFailures = 0

// Debug mode flag
let debugMode = process.env.NODE_ENV === "development"

// Global registry to track all GoTrueClient instances
const goTrueClientRegistry = new Set<any>()

// Connection health monitoring
const connectionHealthHistory: Array<{ timestamp: number; success: boolean; latency: number }> = []
const MAX_HISTORY_ITEMS = 50

// Enable/disable debug logging
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
  }
  console.log(`Supabase client debug mode ${enabled ? "enabled" : "disabled"}`)
}

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (debugMode) {
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
    retryOnError?: boolean
    maxRetries?: number
  } = {},
):
  | SupabaseClient<Database>
  | Promise<SupabaseClient<Database>>
  | ReturnType<typeof createClientComponentClient<Database>> {
  if (typeof window === "undefined") {
    //throw new Error("This client should only be used in the browser")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    //throw new Error("Supabase URL and anon key are required")
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
  connectionAttempts++

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
          storageKey: "wellness-dashboard-auth-v3",
          // Debug flag to help identify issues
          debug: debugMode,
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
          fetch: createEnhancedFetch(options),
        },
        // Add realtime configuration for better connection management
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }

      // Create the client
      const newClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        clientOptions,
      )

      // Test the connection before returning
      testConnection(newClient)
        .then((isConnected) => {
          if (isConnected) {
            // Store the client
            supabaseClient = newClient
            lastSuccessfulConnection = Date.now()
            consecutiveFailures = 0

            // Track the GoTrueClient instance
            if (newClient.auth && (newClient.auth as any)._goTrueClient) {
              goTrueClientRegistry.add((newClient.auth as any)._goTrueClient)
              debugLog(`Registered GoTrueClient instance. Total instances: ${goTrueClientRegistry.size}`)

              // If we have multiple instances, log a warning
              if (goTrueClientRegistry.size > 1) {
                console.warn(
                  `[CRITICAL] Multiple GoTrueClient instances detected (${goTrueClientRegistry.size}). ` +
                    `This may lead to undefined behavior. Please ensure only one instance is created.`,
                )
              }
            }

            // Reset initialization state
            isInitializing = false

            // Resolve the promise with the client
            resolve(newClient)
          } else {
            // Connection test failed
            consecutiveFailures++
            isInitializing = false
            initializationPromise = null

            if (options.retryOnError && consecutiveFailures <= (options.maxRetries || 3)) {
              debugLog(`Connection test failed, retrying (attempt ${consecutiveFailures})`)
              // Retry with exponential backoff
              setTimeout(
                () => {
                  const retryClient = getSupabaseClient(options)
                  if (retryClient instanceof Promise) {
                    retryClient.then(resolve).catch(reject)
                  } else {
                    resolve(retryClient)
                  }
                },
                Math.min(1000 * Math.pow(2, consecutiveFailures - 1), 10000),
              )
            } else {
              reject(new Error("Failed to establish connection to Supabase"))
            }
          }
        })
        .catch((error) => {
          // Connection test threw an error
          consecutiveFailures++
          isInitializing = false
          initializationPromise = null
          reject(error)
        })
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

// Create an enhanced fetch implementation with timeout, retries, and telemetry
function createEnhancedFetch(options: any = {}) {
  return async (url: RequestInfo | URL, fetchOptions: RequestInit = {}) => {
    const timeout = options.timeout || 15000
    const maxRetries = options.maxRetries || 3
    const controller = new AbortController()
    const startTime = Date.now()

    // Merge the provided signal with our abort controller
    const originalSignal = fetchOptions.signal
    if (originalSignal) {
      if (originalSignal.aborted) {
        controller.abort()
      } else {
        originalSignal.addEventListener("abort", () => controller.abort())
      }
    }

    const timeoutId = setTimeout(() => {
      controller.abort()
      debugLog(`Fetch request to ${url.toString()} timed out after ${timeout}ms`)
    }, timeout)

    // Create a function to perform the fetch with retry logic
    const performFetchWithRetry = async (retryCount = 0): Promise<Response> => {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        })

        // Record connection health
        const latency = Date.now() - startTime
        recordConnectionHealth(true, latency)

        // Clear the timeout
        clearTimeout(timeoutId)

        // Check if we got a rate limit or server error response
        if ((response.status === 429 || (response.status >= 500 && response.status < 600)) && retryCount < maxRetries) {
          // Calculate backoff time - exponential with jitter
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
          debugLog(
            `Rate limited or server error (${response.status}). Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`,
          )

          // Wait for the backoff period
          await new Promise((resolve) => setTimeout(resolve, backoffTime))

          // Retry the request
          return performFetchWithRetry(retryCount + 1)
        }

        return response
      } catch (error: any) {
        // Clear the timeout
        clearTimeout(timeoutId)

        // Record connection failure
        recordConnectionHealth(false, Date.now() - startTime)

        // Check if it's a timeout or network error and we should retry
        if (
          retryCount < maxRetries &&
          (error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError"))
        ) {
          // Calculate backoff time - exponential with jitter
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
          debugLog(`Network error: ${error.message}. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

          // Wait for the backoff period
          await new Promise((resolve) => setTimeout(resolve, backoffTime))

          // Retry the request
          return performFetchWithRetry(retryCount + 1)
        }

        throw error
      }
    }

    return performFetchWithRetry()
  }
}

// Record connection health metrics
function recordConnectionHealth(success: boolean, latency: number): void {
  connectionHealthHistory.push({
    timestamp: Date.now(),
    success,
    latency,
  })

  // Keep history size limited
  if (connectionHealthHistory.length > MAX_HISTORY_ITEMS) {
    connectionHealthHistory.shift()
  }
}

// Test the Supabase connection
async function testConnection(client: SupabaseClient<Database>): Promise<boolean> {
  try {
    const startTime = Date.now()
    // Simple health check query - use a simpler query without count(*)
    const { error } = await client.from("profiles").select("id").limit(1)

    const latency = Date.now() - startTime
    recordConnectionHealth(!error, latency)

    if (error) {
      console.error("Supabase connection test error:", error.message)
      return false
    }

    return true
  } catch (error: any) {
    console.error("Supabase connection test exception:", error.message || "Unknown error")
    recordConnectionHealth(false, 0)
    return false
  }
}

// Check the Supabase connection health
export async function checkSupabaseConnection(): Promise<{ isConnected: boolean; latency: number }> {
  try {
    const startTime = Date.now()
    const client = createClientComponentClient<Database>()

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

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseClient() {
  supabaseClient = null
  lastResetTime = Date.now()
  console.log("Supabase client reset")
}

// Get the current client without creating a new one
export function getCurrentClient(): SupabaseClient<Database> | null {
  return supabaseClient
}

// Get connection health metrics
export function getConnectionHealth() {
  // Calculate success rate from history
  const recentEntries = connectionHealthHistory.filter(
    (entry) => Date.now() - entry.timestamp < 300000, // Last 5 minutes
  )

  const successRate =
    recentEntries.length > 0 ? recentEntries.filter((entry) => entry.success).length / recentEntries.length : 1

  // Calculate average latency
  const successfulEntries = recentEntries.filter((entry) => entry.success)
  const avgLatency =
    successfulEntries.length > 0
      ? successfulEntries.reduce((sum, entry) => sum + entry.latency, 0) / successfulEntries.length
      : 0

  return {
    isInitialized: !!supabaseClient,
    isHealthy: successRate > 0.8, // Consider healthy if success rate > 80%
    successRate,
    avgLatency,
    lastSuccessfulConnection,
    connectionAttempts,
    consecutiveFailures,
    clientInstanceCount,
    goTrueClientCount: goTrueClientRegistry.size,
    clientInitTime,
    lastResetTime,
    recentHistory: connectionHealthHistory.slice(-10), // Last 10 entries
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
    connectionAttempts,
    consecutiveFailures,
    connectionHealth: getConnectionHealth(),
    storageKeys:
      typeof window !== "undefined"
        ? Object.keys(localStorage).filter((key) => key.includes("supabase") || key.includes("auth"))
        : [],
  }
}

// Clear any orphaned GoTrueClient instances
export function cleanupOrphanedClients(force = false) {
  // Implementation would depend on how you're tracking clients
  console.log("Cleaning up orphaned clients")
}

// New function to migrate anonymous user data to authenticated user
export async function migrateAnonymousUserData(
  anonymousId: string,
  authenticatedId: string,
): Promise<{
  success: boolean
  error: Error | null
}> {
  if (!supabaseClient) {
    return {
      success: false,
      error: new Error("Supabase client not initialized"),
    }
  }

  try {
    debugLog(`Attempting to migrate data from anonymous user ${anonymousId} to authenticated user ${authenticatedId}`)

    // Call a stored procedure to handle the migration
    const { data, error } = await supabaseClient.rpc("migrate_user_data", {
      anonymous_id: anonymousId,
      authenticated_id: authenticatedId,
    })

    if (error) {
      console.error("Error migrating user data:", error)
      return {
        success: false,
        error: new Error(`Failed to migrate user data: ${error.message}`),
      }
    }

    debugLog(`Successfully migrated data from anonymous user ${anonymousId} to authenticated user ${authenticatedId}`)
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Unexpected error during user data migration:", error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

// Get the Supabase client with enhanced error handling
export function getEnhancedSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>()
    clientInstanceCount++
  }

  return supabaseClient
}

export { supabaseClient }
// If there are references to cleanupOrphanedClients, check our imports in auth-context.tsx to remove them
// This ensures we're only using functions from our singleton supabase-client.ts

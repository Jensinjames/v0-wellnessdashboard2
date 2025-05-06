import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global flag to track initialization
let isInitializing = false

// Singleton pattern for browser client
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

// Connection health tracking
let lastSuccessfulConnection = 0
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 5
const CONNECTION_BACKOFF_BASE = 1000 // ms
const CONNECTION_HEALTH_THRESHOLD = 30000 // 30 seconds

// Debug mode flag
let debugMode = false

// Enable/disable debug logging
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
  }
  console.log(`Supabase client debug mode ${enabled ? "enabled" : "disabled"}`)
}

// Create a single instance of the Supabase client
export function getSupabaseClient(
  options: {
    forceNew?: boolean
    retryOnError?: boolean
    timeout?: number
  } = {},
): ReturnType<typeof createClient<Database>> {
  if (typeof window === "undefined") {
    throw new Error("This client should only be used in the browser")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // If we're already initializing, wait for that to complete
  if (isInitializing) {
    console.log("Supabase client initialization already in progress, returning existing client")
    // Return existing client if we have one, otherwise create a new one
    if (supabaseClient) {
      return supabaseClient
    }
  }

  // Force new client if requested or if the connection is stale
  const shouldCreateNewClient =
    options.forceNew ||
    !supabaseClient ||
    (Date.now() - lastSuccessfulConnection > CONNECTION_HEALTH_THRESHOLD &&
      connectionAttempts < MAX_CONNECTION_ATTEMPTS)

  // Only create a new client if one doesn't exist already or if forced
  if (shouldCreateNewClient) {
    try {
      console.log("Creating new Supabase client instance")

      // Set initializing flag
      isInitializing = true

      // Increment connection attempts
      connectionAttempts++

      // Calculate timeout with exponential backoff if we've had failed attempts
      const timeout =
        options.timeout ||
        (connectionAttempts > 1 ? Math.min(CONNECTION_BACKOFF_BASE * Math.pow(2, connectionAttempts - 1), 10000) : 6000)

      supabaseClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
            storageKey: "wellness-dashboard-auth-token", // Add unique storage key
          },
          global: {
            headers: {
              "x-application-name": "wellness-dashboard",
            },
            // Custom fetch implementation with timeout and retry logic
            fetch: (url, options = {}) => {
              return fetchWithTimeout(url, options, timeout, options.retryOnError || false)
            },
          },
          db: {
            schema: "public",
          },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        },
      )

      // Reset initializing flag
      isInitializing = false

      // Test the connection - but don't block client creation on this
      setTimeout(() => {
        testConnection()
          .then((isConnected) => {
            if (isConnected) {
              // Reset connection attempts on success
              connectionAttempts = 0
              lastSuccessfulConnection = Date.now()
              console.log("Supabase connection test successful")
            } else {
              console.log("Supabase connection test failed")
            }
          })
          .catch((error) => {
            console.error("Supabase connection test error:", error.message || "Unknown error")
          })
      }, 100)
    } catch (error) {
      // Reset initializing flag on error
      isInitializing = false
      console.error("Error creating Supabase client:", error)
      // If we fail to create a client, we'll try again next time with backoff
      throw error
    }
  }

  if (!supabaseClient) {
    throw new Error("Failed to create Supabase client")
  }

  return supabaseClient
}

// Custom fetch implementation with timeout and retry
async function fetchWithTimeout(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 6000,
  retry = false,
  retryCount = 0,
): Promise<Response> {
  const MAX_RETRIES = 3
  const controller = new AbortController()
  const { signal } = controller

  // Merge the provided signal with our abort controller
  const originalSignal = options.signal

  if (originalSignal) {
    // If the original signal aborts, abort our controller too
    if (originalSignal.aborted) {
      controller.abort()
    } else {
      originalSignal.addEventListener("abort", () => controller.abort())
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal,
    })

    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if we got a rate limit response
    if (response.status === 429) {
      if (retry && retryCount < MAX_RETRIES) {
        // Calculate backoff time - exponential with jitter
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
        console.log(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

        // Wait for the backoff period
        await new Promise((resolve) => setTimeout(resolve, backoffTime))

        // Retry the request
        return fetchWithTimeout(url, options, timeout, retry, retryCount + 1)
      }
    }

    // Update connection health on successful response
    if (response.ok) {
      lastSuccessfulConnection = Date.now()
    }

    return response
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if it's a timeout or network error and we should retry
    if (
      retry &&
      retryCount < MAX_RETRIES &&
      (error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError"))
    ) {
      // Calculate backoff time - exponential with jitter
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
      console.log(`Network error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

      // Wait for the backoff period
      await new Promise((resolve) => setTimeout(resolve, backoffTime))

      // Retry the request
      return fetchWithTimeout(url, options, timeout, retry, retryCount + 1)
    }

    throw error
  }
}

// Test the Supabase connection with a simple auth check instead of a DB query
async function testConnection(): Promise<boolean> {
  if (!supabaseClient) return false

  try {
    // Use a simple auth check instead of a DB query
    // This just checks if we can reach Supabase without requiring table access
    const { data, error } = await supabaseClient.auth.getSession()

    if (error) {
      console.error("Supabase connection test error:", error.message)
      return false
    }

    // If we get here, the connection is working
    return true
  } catch (error: any) {
    console.error("Supabase connection test exception:", error.message || "Unknown error")
    return false
  }
}

// Check connection health
export async function checkSupabaseConnection(): Promise<boolean> {
  return testConnection()
}

// Reset the client (useful for testing or when auth state changes)
export function resetSupabaseClient() {
  supabaseClient = null
  connectionAttempts = 0
  isInitializing = false
}

// Get connection health metrics
export function getConnectionHealth() {
  return {
    lastSuccessfulConnection,
    connectionAttempts,
    isHealthy: Date.now() - lastSuccessfulConnection < CONNECTION_HEALTH_THRESHOLD,
    isInitialized: !!supabaseClient,
  }
}

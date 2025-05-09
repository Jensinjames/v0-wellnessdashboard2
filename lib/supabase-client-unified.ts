/**
 * Unified Supabase Client
 *
 * This module provides a centralized approach to Supabase client creation
 * with enhanced error handling, automatic retries, and consistent configuration.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Client instance registry for tracking active clients
const clientRegistry = new Set<symbol>()
let clientCount = 0
let lastInitTime = Date.now()
let lastResetTime: number | null = null

// Error tracking
let consecutiveErrors = 0
const MAX_CONSECUTIVE_ERRORS = 5

// Debug mode configuration
let isDebugMode = process.env.NODE_ENV === "development"

// Connection health tracking
const lastConnectionAttempt = 0
const connectionAttempts = 0
const CONNECTION_BACKOFF_BASE = 1000 // ms

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (isDebugMode) {
    console.log("[Supabase Client]", ...args)
  }
}

interface ClientOptions {
  persistSession?: boolean
  autoRefreshToken?: boolean
  debugMode?: boolean
  timeout?: number
  retryOnError?: boolean
  maxRetries?: number
}

/**
 * Sets the debug mode for Supabase client operations
 */
export function setClientDebugMode(enabled: boolean): void {
  isDebugMode = enabled
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
  }
  debugLog(`Debug mode ${enabled ? "enabled" : "disabled"}`)
}

/**
 * Creates a new Supabase client with robust error handling and configuration
 */
export function createSupabaseClient(options: ClientOptions = {}): SupabaseClient<Database> {
  const {
    persistSession = true,
    autoRefreshToken = true,
    debugMode = isDebugMode,
    timeout = 10000,
    retryOnError = true,
    maxRetries = 3,
  } = options

  // Ensure we have environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not set")
  }

  // Create a unique ID for this client instance
  const clientId = Symbol()

  // Set up retry and timeout logic
  const enhancedFetch = createEnhancedFetch(timeout, retryOnError, maxRetries)

  // Create the client with our enhanced configuration
  const client = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      auth: {
        persistSession,
        autoRefreshToken,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      global: {
        headers: {
          "x-application-name": "wellness-dashboard",
        },
        fetch: enhancedFetch,
      },
      db: {
        schema: "public",
      },
    },
  })

  // Register this client in our registry
  clientRegistry.add(clientId)
  clientCount++
  lastInitTime = Date.now()

  // Add cleanup method to this client
  const originalAuth = client.auth
  client.auth = {
    ...originalAuth,
    // Add cleanup method
    cleanupClient: () => {
      if (clientRegistry.has(clientId)) {
        clientRegistry.delete(clientId)
        clientCount--
        debugLog(`Client cleaned up, ${clientCount} clients remaining`)
        return true
      }
      return false
    },
    // Add a method to get client stats
    getClientStats: () => {
      return {
        clientCount,
        lastInitTime,
        lastResetTime,
        registrySize: clientRegistry.size,
        consecutiveErrors,
        isDebugMode,
      }
    },
  } as typeof client.auth

  debugLog(`Client created, total clients: ${clientCount}`)
  return client
}

/**
 * Creates an enhanced fetch function with timeout and retry capabilities
 */
function createEnhancedFetch(timeout: number, retryOnError: boolean, maxRetries: number) {
  return async function enhancedFetch(
    url: RequestInfo | URL,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<Response> {
    // Calculate backoff with exponential delay
    const backoff =
      retryCount > 0
        ? Math.min(CONNECTION_BACKOFF_BASE * Math.pow(2, retryCount - 1), 10000) * (0.75 + Math.random() * 0.5)
        : 0

    // If we're retrying, wait for the backoff period
    if (backoff > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const { signal } = controller

    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal,
      })

      // Clear timeout
      clearTimeout(timeoutId)

      // Handle rate limiting (429)
      if (response.status === 429 && retryOnError && retryCount < maxRetries) {
        debugLog(`Rate limited, retrying (${retryCount + 1}/${maxRetries})`)
        return enhancedFetch(url, options, retryCount + 1)
      }

      // Reset consecutive errors on success
      if (response.ok) {
        consecutiveErrors = 0
      } else {
        consecutiveErrors++
      }

      return response
    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId)

      // Increment error count
      consecutiveErrors++

      // Retry on network errors if we haven't exceeded max retries
      const isNetworkError =
        error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError")

      if (isNetworkError && retryOnError && retryCount < maxRetries) {
        debugLog(`Network error, retrying (${retryCount + 1}/${maxRetries})`)
        return enhancedFetch(url, options, retryCount + 1)
      }

      throw error
    }
  }
}

/**
 * Singleton pattern implementation for client-side Supabase usage
 */
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Gets or creates a Supabase client singleton
 */
export function getSupabaseClient(options: ClientOptions = {}): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(options)
  }
  return supabaseInstance
}

/**
 * Resets the singleton Supabase client
 */
export function resetSupabaseClient(): void {
  if (
    supabaseInstance &&
    "auth" in supabaseInstance &&
    typeof (supabaseInstance.auth as any).cleanupClient === "function"
  ) {
    ;(supabaseInstance.auth as any).cleanupClient()
  }

  supabaseInstance = null
  lastResetTime = Date.now()
  debugLog("Supabase client reset")
}

/**
 * Gets client statistics for monitoring
 */
export function getClientStats() {
  return {
    clientCount,
    lastInitTime,
    lastResetTime,
    registrySize: clientRegistry.size,
    consecutiveErrors,
    isDebugMode,
  }
}

/**
 * Checks if the Supabase URL is valid and correctly configured
 */
export function validateSupabaseConfig(): boolean {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) return false

    // Validate URL format
    new URL(url)

    // Check for required environment variables
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  } catch (e) {
    return false
  }
}

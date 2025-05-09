/**
 * Supabase Client Singleton
 *
 * This module provides a centralized way to access the Supabase client
 * throughout the application, ensuring only one instance exists.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global variables for singleton pattern
let supabaseInstance: SupabaseClient<Database> | null = null
let clientInstanceCount = 0
let clientCreatedAt: number | null = null
let isInitializing = false
let initPromise: Promise<SupabaseClient<Database>> | null = null
let lastResetTime: number | null = null

// Debug mode flag - safely check localStorage
const getDebugMode = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("supabase_debug") === "true" || process.env.NODE_ENV === "development"
  }
  return process.env.NODE_ENV === "development"
}

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (getDebugMode()) {
    console.log("[Supabase Singleton]", ...args)
  }
}

// Global registry to track GoTrueClient instances
const goTrueClientRegistry = new Set<any>()

// Declare global window property for TypeScript
declare global {
  interface Window {
    __SUPABASE_CLIENT?: SupabaseClient<Database>
    __SUPABASE_CLIENT_COUNT?: number
    __GOTRUE_CLIENTS?: Set<any>
    __SUPABASE_LAST_RESET?: number
  }
}

// Initialize global tracking in browser
if (typeof window !== "undefined") {
  window.__SUPABASE_CLIENT_COUNT = window.__SUPABASE_CLIENT_COUNT || 0
  window.__GOTRUE_CLIENTS = window.__GOTRUE_CLIENTS || new Set()
}

// Options for the Supabase client
interface ClientOptions {
  persistSession?: boolean
  autoRefreshToken?: boolean
  debugMode?: boolean
  forceNew?: boolean
}

/**
 * Get the Supabase client singleton
 * This ensures only one client instance is created per browser context
 */
export function getSupabaseClient(
  options: ClientOptions = {},
): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  const { forceNew = false, debugMode = getDebugMode(), persistSession = true, autoRefreshToken = true } = options

  // For server-side rendering, always create a new client
  if (typeof window === "undefined") {
    debugLog("Server-side rendering detected, creating new client")
    return createClientComponentClient<Database>({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        auth: {
          persistSession,
          autoRefreshToken,
          flowType: "pkce",
        },
      },
    })
  }

  // If we're forcing a new client, reset the existing one
  if (forceNew) {
    debugLog("Forcing new client creation")
    resetSupabaseClient()
  }

  // If we already have a global instance in the window object, use it
  if (window.__SUPABASE_CLIENT && !forceNew) {
    debugLog("Using existing global client instance")
    return window.__SUPABASE_CLIENT
  }

  // If we already have an instance and aren't forcing a new one, return it
  if (supabaseInstance && !forceNew) {
    debugLog("Using existing module-level client instance")
    return supabaseInstance
  }

  // If we're already initializing, return the promise
  if (isInitializing && initPromise && !forceNew) {
    debugLog("Client initialization already in progress, returning promise")
    return initPromise
  }

  // Set initializing flag and create a promise
  isInitializing = true
  clientInstanceCount++

  debugLog(`Creating new Supabase client (instance #${clientInstanceCount})`)

  // Create a new initialization promise
  initPromise = new Promise<SupabaseClient<Database>>((resolve, reject) => {
    try {
      // Record initialization time
      clientCreatedAt = Date.now()

      // Create the client
      const client = createClientComponentClient<Database>({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        options: {
          auth: {
            persistSession,
            autoRefreshToken,
            flowType: "pkce",
            debug: debugMode,
            storageKey: "supabase-auth-token-v3",
          },
          global: {
            headers: {
              "x-client-info": `supabase-singleton/${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`,
            },
          },
        },
      })

      // Store the client
      supabaseInstance = client
      window.__SUPABASE_CLIENT = client
      window.__SUPABASE_CLIENT_COUNT = (window.__SUPABASE_CLIENT_COUNT || 0) + 1

      // Track the GoTrueClient instance
      if (client.auth && (client.auth as any)._goTrueClient) {
        const goTrueClient = (client.auth as any)._goTrueClient
        goTrueClientRegistry.add(goTrueClient)
        window.__GOTRUE_CLIENTS?.add(goTrueClient)

        debugLog(`Registered GoTrueClient instance. Total instances: ${goTrueClientRegistry.size}`)

        // If we have multiple instances, log a warning
        if (goTrueClientRegistry.size > 1) {
          console.warn(
            `[CRITICAL] Multiple GoTrueClient instances detected (${goTrueClientRegistry.size}). ` +
              `This may lead to undefined behavior. Please ensure only one instance is created.`,
          )
        }
      }

      // Add unload event listener to clean up client on page unload
      window.addEventListener("beforeunload", () => {
        debugLog("Page unloading, cleaning up Supabase client")
        cleanupOrphanedClients(true)
      })

      // Reset initialization state
      isInitializing = false

      // Resolve the promise with the client
      resolve(client)
    } catch (error) {
      // Reset initialization state
      isInitializing = false
      initPromise = null

      // Log and reject the promise
      console.error("Error creating Supabase client:", error)
      reject(error)
    }
  })

  return initPromise
}

/**
 * Reset the Supabase client
 * This is useful for sign out or when you want to force a new client
 */
export function resetSupabaseClient(): void {
  debugLog("Resetting Supabase client")

  // Clean up any event listeners or timers associated with the client
  if (supabaseInstance && (supabaseInstance as any)._closeChannel) {
    try {
      ;(supabaseInstance as any)._closeChannel()
    } catch (e) {
      debugLog("Error closing realtime channel:", e)
    }
  }

  // Clear the client and initialization state
  supabaseInstance = null
  isInitializing = false
  initPromise = null
  lastResetTime = Date.now()

  // Clear from window object
  if (typeof window !== "undefined") {
    delete window.__SUPABASE_CLIENT
    window.__SUPABASE_LAST_RESET = lastResetTime
  }

  // Clear the GoTrueClient registry
  goTrueClientRegistry.clear()
  if (typeof window !== "undefined" && window.__GOTRUE_CLIENTS) {
    window.__GOTRUE_CLIENTS.clear()
  }

  debugLog("Supabase client reset complete")
}

/**
 * Get the current client without creating a new one
 * Returns null if no client exists
 */
export function getCurrentClient(): SupabaseClient<Database> | null {
  if (typeof window !== "undefined" && window.__SUPABASE_CLIENT) {
    return window.__SUPABASE_CLIENT
  }
  return supabaseInstance
}

/**
 * Clean up orphaned GoTrueClient instances
 * This helps prevent memory leaks and undefined behavior
 */
export function cleanupOrphanedClients(forceCleanup = false): void {
  if (goTrueClientRegistry.size <= 1 && !forceCleanup) return

  debugLog(`Cleaning up orphaned GoTrueClient instances. Before: ${goTrueClientRegistry.size}`)

  // Keep only the current client's GoTrueClient
  if (supabaseInstance && (supabaseInstance.auth as any)._goTrueClient) {
    const currentGoTrueClient = (supabaseInstance.auth as any)._goTrueClient
    goTrueClientRegistry.clear()
    goTrueClientRegistry.add(currentGoTrueClient)

    // Also update window registry if available
    if (typeof window !== "undefined" && window.__GOTRUE_CLIENTS) {
      window.__GOTRUE_CLIENTS.clear()
      window.__GOTRUE_CLIENTS.add(currentGoTrueClient)
    }
  } else {
    // If we don't have a current client, clear all
    goTrueClientRegistry.clear()
    if (typeof window !== "undefined" && window.__GOTRUE_CLIENTS) {
      window.__GOTRUE_CLIENTS.clear()
    }
  }

  debugLog(`Cleanup complete. After: ${goTrueClientRegistry.size}`)
}

/**
 * Get statistics about the Supabase client
 * Useful for debugging
 */
export function getClientStats() {
  return {
    hasClient: !!supabaseInstance || (typeof window !== "undefined" && !!window.__SUPABASE_CLIENT),
    isInitializing: isInitializing,
    instanceCount: clientInstanceCount,
    goTrueClientCount: goTrueClientRegistry.size,
    windowGoTrueClientCount:
      typeof window !== "undefined" && window.__GOTRUE_CLIENTS ? window.__GOTRUE_CLIENTS.size : 0,
    clientCreatedAt,
    lastResetTime,
    storageKeys:
      typeof window !== "undefined"
        ? Object.keys(localStorage).filter((key) => key.includes("supabase") || key.includes("auth"))
        : [],
  }
}

/**
 * Set debug mode for Supabase client
 */
export function setDebugMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
  }
  debugLog(`Debug mode ${enabled ? "enabled" : "disabled"}`)
}

/**
 * Initialize the Supabase client early
 * This is useful for ensuring the client is ready before it's needed
 */
export function initializeSupabaseClient(): Promise<SupabaseClient<Database>> {
  debugLog("Early initialization of Supabase client")
  const clientPromise = getSupabaseClient()

  if (clientPromise instanceof Promise) {
    return clientPromise
  }

  return Promise.resolve(clientPromise)
}

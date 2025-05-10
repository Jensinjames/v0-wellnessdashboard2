/**
 * Supabase Singleton Manager
 *
 * This module provides a centralized way to manage a single Supabase client instance
 * across the entire application, preventing multiple GoTrueClient instances.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global registry to track GoTrueClient instances
const goTrueClientRegistry = new Set<any>()

// Debug mode flag - safely check localStorage
const getDebugMode = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("supabase_debug") === "true" || process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  }
  return false
}

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (getDebugMode()) {
    console.log("[Supabase Singleton]", ...args)
  }
}

// Global variable to track if we've already warned about multiple instances
let hasWarnedMultipleInstances = false

// Declare global window property for TypeScript
declare global {
  interface Window {
    __SUPABASE_CLIENT?: SupabaseClient<Database>
    __SUPABASE_CLIENT_CREATED?: boolean
    __SUPABASE_CLIENT_COUNT?: number
    __SUPABASE_DEBUG_MODE?: boolean
  }
}

// Initialize client count
if (typeof window !== "undefined" && window.__SUPABASE_CLIENT_COUNT === undefined) {
  window.__SUPABASE_CLIENT_COUNT = 0
}

/**
 * Register a global Supabase client in the window object
 * This ensures only one client exists across the entire application
 */
export function registerGlobalClient(client: SupabaseClient<Database>): void {
  if (typeof window === "undefined") return

  // Check if we already have a client
  if (window.__SUPABASE_CLIENT) {
    if (!hasWarnedMultipleInstances) {
      console.warn(
        "Attempted to register a new Supabase client when one already exists. " +
          "This could lead to multiple GoTrueClient instances. " +
          "The existing client will be used instead.",
      )
      hasWarnedMultipleInstances = true
    }
    return
  }

  // Register the client
  window.__SUPABASE_CLIENT = client
  debugLog("Registered global Supabase client")

  // Track the GoTrueClient instance
  if (client.auth && (client.auth as any)._goTrueClient) {
    goTrueClientRegistry.add((client.auth as any)._goTrueClient)
    debugLog(`Registered GoTrueClient instance. Total instances: ${goTrueClientRegistry.size}`)
  }

  // Add unload event listener to clean up client on page unload
  window.addEventListener("beforeunload", () => {
    debugLog("Page unloading, cleaning up Supabase client")
    clearGlobalClient()
  })
}

/**
 * Get the global Supabase client
 * Returns null if no client exists
 */
export function getGlobalClient(): SupabaseClient<Database> | null {
  if (typeof window === "undefined") return null
  return window.__SUPABASE_CLIENT || null
}

/**
 * Check if a global client exists
 */
export function hasGlobalClient(): boolean {
  if (typeof window === "undefined") return false
  return !!window.__SUPABASE_CLIENT
}

/**
 * Clear the global client
 * Useful for sign out or when resetting the client
 */
export function clearGlobalClient(): void {
  if (typeof window === "undefined") return

  // Clear the client
  delete window.__SUPABASE_CLIENT

  // Clear the GoTrueClient registry
  goTrueClientRegistry.clear()

  debugLog("Cleared global Supabase client")
}

/**
 * Create a new Supabase client
 * This should only be used if no global client exists
 */
export function createNewClient(
  options: {
    persistSession?: boolean
    autoRefreshToken?: boolean
    debugMode?: boolean
  } = {},
): SupabaseClient<Database> {
  const { persistSession = true, autoRefreshToken = true, debugMode = getDebugMode() } = options

  debugLog("Creating new Supabase client")

  const client = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      auth: {
        persistSession,
        autoRefreshToken,
        storageKey: "supabase-auth-token-v3",
        flowType: "pkce",
        debug: debugMode,
      },
      global: {
        headers: {
          "x-client-info": `supabase-singleton/${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`,
        },
      },
    },
  })

  // Register the client globally
  registerGlobalClient(client)

  return client
}

/**
 * Set the debug mode for Supabase
 */
export function setSupabaseDebugMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_debug", enabled ? "true" : "false")
  }
}

/**
 * Get statistics about the Supabase client
 * Useful for debugging
 */
export function getClientStats() {
  return {
    hasGlobalClient: hasGlobalClient(),
    goTrueClientCount: goTrueClientRegistry.size,
    storageKeys:
      typeof window !== "undefined"
        ? Object.keys(localStorage).filter((key) => key.includes("supabase") || key.includes("auth"))
        : [],
  }
}

/**
 * Clean up orphaned GoTrueClient instances
 * This helps prevent memory leaks and undefined behavior
 */
export function cleanupOrphanedClients(forceCleanup = false): void {
  if (typeof window === "undefined") return

  const client = getGlobalClient()

  if (goTrueClientRegistry.size > 1 || forceCleanup) {
    debugLog(`Cleaning up orphaned GoTrueClient instances. Before: ${goTrueClientRegistry.size}`)

    // Keep only the current client's GoTrueClient
    if (client && (client.auth as any)._goTrueClient) {
      const currentGoTrueClient = (client.auth as any)._goTrueClient
      goTrueClientRegistry.clear()
      goTrueClientRegistry.add(currentGoTrueClient)
    } else {
      // If we don't have a current client, clear all
      goTrueClientRegistry.clear()
    }

    debugLog(`Cleanup complete. After: ${goTrueClientRegistry.size}`)
  }
}

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    __SUPABASE_CLIENT: SupabaseClient<Database>
  }
}

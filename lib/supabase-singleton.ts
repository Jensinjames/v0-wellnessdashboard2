/**
 * Supabase Singleton
 *
 * This module provides a true singleton pattern for Supabase client
 * to prevent multiple GoTrueClient instances from being created.
 */
"use client"

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { clientEnv, isClient, validateEnv } from "@/lib/env"

// Global singleton instance
let instance: SupabaseClient<Database> | null = null

// Initialization state
let isInitializing = false
let initPromise: Promise<SupabaseClient<Database>> | null = null

// Debug mode
const DEBUG = clientEnv.DEBUG_MODE

// Debug logging
function log(...args: any[]) {
  if (DEBUG) {
    console.log("[SupabaseSingleton]", ...args)
  }
}

/**
 * Get the Supabase client singleton
 * This implementation ensures only one client is ever created
 */
export function getSupabaseClient(): SupabaseClient<Database> | Promise<SupabaseClient<Database>> {
  // Ensure we're on the client side
  if (!isClient) {
    throw new Error("getSupabaseClient must only be called on the client side")
  }

  // If we already have an instance, return it
  if (instance) {
    return instance
  }

  // If initialization is in progress, return the promise
  if (isInitializing && initPromise) {
    return initPromise
  }

  // Validate environment variables
  if (!validateEnv()) {
    throw new Error("Missing required environment variables for Supabase client")
  }

  // Set initializing flag
  isInitializing = true

  // Create initialization promise
  initPromise = new Promise<SupabaseClient<Database>>((resolve, reject) => {
    try {
      log("Creating Supabase client singleton")

      // Create the client
      const client = createClient<Database>(clientEnv.SUPABASE_URL!, clientEnv.SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          storageKey: "wellness-dashboard-auth",
          debug: DEBUG,
        },
        global: {
          headers: {
            "x-application-name": "wellness-dashboard-client",
          },
        },
      })

      // Store the instance
      instance = client

      // Reset initialization state
      isInitializing = false

      // Resolve with the client
      resolve(client)

      log("Supabase client singleton created successfully")
    } catch (error) {
      // Reset initialization state
      isInitializing = false
      initPromise = null

      // Log and reject
      console.error("Error creating Supabase client:", error)
      reject(error)
    }
  })

  return initPromise
}

/**
 * Reset the Supabase client singleton
 * This should be called when signing out to ensure a clean state
 */
export function resetSupabaseClient(): void {
  log("Resetting Supabase client singleton")

  // Clear the instance
  instance = null
  isInitializing = false
  initPromise = null
}

/**
 * Check if the Supabase client is initialized
 */
export function isSupabaseClientInitialized(): boolean {
  return !!instance
}

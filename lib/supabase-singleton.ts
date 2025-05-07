"use client"

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// For debugging
export let instanceCount = 0

// Global variables for singleton pattern
let supabaseClient: SupabaseClient<Database> | null = null

/**
 * Creates a Supabase client singleton
 * This ensures only one client instance is used across the application
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // If we already have a client, return it
  if (supabaseClient) {
    return supabaseClient
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("SSR client supabaseUrl and supabaseKey are required!")
  }

  // Create a new client
  instanceCount++

  console.log(`[Supabase Singleton] Creating new Supabase client instance (${instanceCount})`)

  supabaseClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        storageKey: "wellness-dashboard-auth-token",
      },
      global: {
        headers: {
          "x-application-name": "wellness-dashboard",
          "x-client-instance": `singleton-${instanceCount}`,
        },
      },
    },
  )

  return supabaseClient
}

// Alias for getSupabaseClient to maintain compatibility with existing code
export const createSupabaseSingleton = getSupabaseClient

// Track instances of GoTrue clients
const goTrueClients = new Set<any>()

// Monitor for multiple GoTrue client instances
export function startGoTrueMonitoring(intervalMs = 60000): () => void {
  if (typeof window === "undefined") return () => {}

  // Function to check for multiple instances
  const checkForMultipleInstances = () => {
    if (supabaseClient) {
      const goTrueClient = (supabaseClient.auth as any)?._goTrueClient

      if (goTrueClient) {
        goTrueClients.add(goTrueClient)

        if (goTrueClients.size > 1) {
          console.warn(
            `[CRITICAL] Multiple GoTrueClient instances detected (${goTrueClients.size}). ` +
              `This may lead to authentication issues. Please ensure only the singleton pattern is used.`,
          )

          // Clean up - keep only the current one
          goTrueClients.clear()
          goTrueClients.add(goTrueClient)
        }
      }
    }
  }

  // Initial check
  checkForMultipleInstances()

  // Set up interval to periodically check
  const intervalId = setInterval(checkForMultipleInstances, intervalMs)

  // Return function to stop monitoring
  return () => clearInterval(intervalId)
}

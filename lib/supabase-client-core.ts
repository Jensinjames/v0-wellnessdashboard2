"use client"

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseClient")

// Singleton instance
let supabaseClient: SupabaseClient<Database> | null = null
let instanceCount = 0

// Track client creation for debugging
const clientCreationTimestamp = new Date().toISOString()
const clientId = Math.random().toString(36).substring(2, 9)
const lastInitTime = Date.now()
const lastResetTime = 0

/**
 * Get the Supabase client for client-side usage
 * This implements a singleton pattern to ensure only one client instance exists
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // Only run in browser
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseClient should only be called in browser context. Use createServerSupabaseClient for server context.",
    )
  }

  // Create client if it doesn't exist
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL and anon key must be defined in environment variables")
    }

    // Create a new client
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })

    // Track instance count and time
    instanceCount++
    logger.info(`Creating new Supabase client instance (${instanceCount})`, {
      clientId,
      timestamp: clientCreationTimestamp,
    })
  }

  return supabaseClient
}

/**
 * Create a Supabase client for server components or API routes
 * Does not use singleton pattern as server components are stateless
 */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables for server client")
  }

  return createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "wellness-dashboard-server",
      },
    },
  })
}

/**
 * Reset the Supabase client (for testing/debugging)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null
  instanceCount = 0
  logger.info("Supabase client has been reset")
}

/**
 * Get debug information about the Supabase client
 */
export function getSupabaseClientMetrics() {
  return {
    hasActiveClient: !!supabaseClient,
    clientInitCount: instanceCount,
    lastInitTime,
    lastResetTime,
    clientId,
    createdAt: clientCreationTimestamp,
    recentSuccessRate: 1,
    avgLatency: 0,
    recentErrors: [],
  }
}

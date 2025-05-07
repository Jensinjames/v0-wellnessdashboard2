"use client"

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global variables for singleton pattern
let supabaseClient: SupabaseClient<Database> | null = null

/**
 * Creates a Supabase client singleton
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required Supabase environment variables")
  }

  supabaseClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      global: {
        headers: {
          "x-application-name": "wellness-dashboard",
        },
      },
    },
  )

  return supabaseClient
}

// Placeholder for GoTrue monitoring function
export function startGoTrueMonitoring(intervalMs = 60000): () => void {
  // This is a placeholder - actual implementation would go here
  // and likely involve checking for multiple instances of the GoTrue client
  // and logging warnings or errors
  console.warn(
    "[Supabase Singleton] GoTrueClient monitoring is not fully implemented. Add logic to check for multiple instances.",
  )

  // Return a no-op function to stop monitoring
  return () => {
    console.log("[Supabase Singleton] GoTrueClient monitoring stopped.")
  }
}

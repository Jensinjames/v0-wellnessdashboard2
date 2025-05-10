/**
 * Initialize Supabase Client
 *
 * This module provides a function to initialize the Supabase client early,
 * before it's needed by components. This helps prevent multiple instances.
 */

import { getSupabaseClient } from "@/lib/supabase-singleton"

let initialized = false

/**
 * Initialize the Supabase client early
 * This is useful for ensuring the client is ready before it's needed
 */
export async function initializeSupabaseEarly() {
  if (initialized) return

  try {
    // Only run in the browser
    if (typeof window === "undefined") return

    console.log("[Supabase] Early initialization started")

    // Get the client
    const clientPromise = getSupabaseClient()

    if (clientPromise instanceof Promise) {
      await clientPromise
    }

    initialized = true
    console.log("[Supabase] Early initialization complete")
  } catch (error) {
    console.error("[Supabase] Early initialization failed:", error)
  }
}

// Auto-initialize in development mode
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Use a small delay to ensure the app has loaded
  setTimeout(() => {
    initializeSupabaseEarly()
  }, 100)
}

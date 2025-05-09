/**
 * Initialize Supabase client
 *
 * This module initializes the Supabase client when the app starts
 * to ensure a single instance is created early.
 */

import { getSupabaseClient } from "@/lib/supabase-singleton"

// Debug mode flag - safely check localStorage
const getDebugMode = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("supabase_debug") === "true" || process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  }
  return false
}

// Initialize the Supabase client
export function initializeSupabase(): void {
  if (typeof window === "undefined") return

  // Only initialize in the browser
  if (document.readyState === "loading") {
    // If the document is still loading, wait for it to be ready
    document.addEventListener("DOMContentLoaded", () => {
      getSupabaseClient({
        debugMode: getDebugMode(),
      })
    })
  } else {
    // If the document is already loaded, initialize immediately
    getSupabaseClient({
      debugMode: getDebugMode(),
    })
  }
}

// Call the initialization function
initializeSupabase()

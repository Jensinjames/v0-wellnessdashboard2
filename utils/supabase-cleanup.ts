/**
 * Supabase Cleanup Utility
 * Provides functions to clean up Supabase resources
 */
"use client"

import { cleanup } from "@/lib/supabase-manager"

/**
 * Clean up Supabase resources
 * This should be called when the application is shutting down
 */
export function cleanupSupabase(): void {
  // Clean up Supabase manager
  cleanup()

  // Force garbage collection if available
  if (typeof window !== "undefined" && window.gc) {
    try {
      // @ts-ignore - gc is not in the standard TypeScript types
      window.gc()
    } catch (e) {
      // Ignore errors, gc might not be available
    }
  }
}

/**
 * Clean up orphaned clients
 * This is the function required by the deployment
 */
export function cleanupOrphanedClients(): void {
  cleanupSupabase()
}

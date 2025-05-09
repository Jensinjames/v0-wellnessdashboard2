/**
 * Global Supabase Client Manager
 *
 * This module provides a true singleton pattern for Supabase client instances
 * across the entire application, preventing duplicate instances and memory leaks.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

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
 * Register a Supabase client as the global singleton
 */
export function registerGlobalClient(client: SupabaseClient<Database>): void {
  if (typeof window === "undefined") return

  // Store the client in the global window object
  window.__SUPABASE_CLIENT = client
  window.__SUPABASE_CLIENT_CREATED = true
  window.__SUPABASE_CLIENT_COUNT = (window.__SUPABASE_CLIENT_COUNT || 0) + 1

  if (window.__SUPABASE_DEBUG_MODE || process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    console.log(`[Supabase] Registered global client. Total created: ${window.__SUPABASE_CLIENT_COUNT}`)
  }
}

/**
 * Get the global Supabase client if it exists
 */
export function getGlobalClient(): SupabaseClient<Database> | null {
  if (typeof window === "undefined") return null
  return window.__SUPABASE_CLIENT || null
}

/**
 * Check if a global Supabase client has been created
 */
export function hasGlobalClient(): boolean {
  if (typeof window === "undefined") return false
  return !!window.__SUPABASE_CLIENT
}

/**
 * Clear the global Supabase client (useful for testing or sign out)
 */
export function clearGlobalClient(): void {
  if (typeof window === "undefined") return

  // Clean up the client if possible
  if (window.__SUPABASE_CLIENT && (window.__SUPABASE_CLIENT as any)._closeChannel) {
    try {
      ;(window.__SUPABASE_CLIENT as any)._closeChannel()
    } catch (e) {
      // Ignore errors during cleanup
    }
  }

  window.__SUPABASE_CLIENT = undefined

  if (window.__SUPABASE_DEBUG_MODE || process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    console.log("[Supabase] Global client cleared")
  }
}

/**
 * Set debug mode for Supabase client
 */
export function setSupabaseDebugMode(enabled: boolean): void {
  if (typeof window === "undefined") return

  window.__SUPABASE_DEBUG_MODE = enabled
  localStorage.setItem("supabase_debug", enabled ? "true" : "false")

  console.log(`[Supabase] Debug mode ${enabled ? "enabled" : "disabled"}`)
}

/**
 * Get current debug mode status
 */
export function isSupabaseDebugMode(): boolean {
  if (typeof window === "undefined") return false

  return (
    window.__SUPABASE_DEBUG_MODE ||
    localStorage.getItem("supabase_debug") === "true" ||
    process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  )
}

/**
 * Get client creation statistics
 */
export function getClientStats(): { count: number; hasGlobalClient: boolean } {
  if (typeof window === "undefined") {
    return { count: 0, hasGlobalClient: false }
  }

  return {
    count: window.__SUPABASE_CLIENT_COUNT || 0,
    hasGlobalClient: !!window.__SUPABASE_CLIENT,
  }
}

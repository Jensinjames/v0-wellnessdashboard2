/**
 * Auth Compatibility Layer
 *
 * This module provides compatibility between the App Router and Pages Router
 * for authentication-related functionality.
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Create a Supabase client that works in both App Router and Pages Router
export function createCompatClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Helper function to determine if we're in the App Router or Pages Router
export function isAppRouter() {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    return false
  }

  // In Node.js, check if next/headers is available
  try {
    require("next/headers")
    return true
  } catch (e) {
    return false
  }
}

// Get the appropriate auth redirect URL based on the router type
export function getAuthRedirectUrl(path = "/auth/callback") {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")

  return `${baseUrl}${path}`
}

"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Singleton pattern for Supabase client to prevent multiple instances
let supabaseClient: SupabaseClient<Database> | null = null

/**
 * Creates a singleton Supabase client for use in client components
 * This ensures we don't create multiple instances of the client
 */
export function createClient(): SupabaseClient<Database> {
  if (supabaseClient) return supabaseClient

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Check your .env.local file.")
  }

  // Create the client
  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return supabaseClient
}

/**
 * Get the current user asynchronously
 * This is the recommended way to get the current user
 * as it will always return the most up-to-date user data
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error.message)
      return null
    }

    return data.user
  } catch (error) {
    console.error("Unexpected error getting current user:", error)
    return null
  }
}

/**
 * Get the current session asynchronously
 * This is useful for components that need to access the session token
 */
export async function getCurrentSession() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting current session:", error.message)
      return null
    }

    return data.session
  } catch (error) {
    console.error("Unexpected error getting current session:", error)
    return null
  }
}

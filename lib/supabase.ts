"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`)
}

// SINGLETON PATTERN: Create a single instance of the Supabase client for the browser
let browserClient: ReturnType<typeof createClient<Database>> | null = null

// Client-side Supabase client (browser)
export function createBrowserClient() {
  if (typeof window === "undefined") {
    // Return a dummy client for SSR that won't persist anything
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  // Return the existing instance if it exists
  if (browserClient) return browserClient

  // Create a new instance if it doesn't exist
  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sb-auth-token",
      flowType: "pkce",
    },
  })

  return browserClient
}

// Helper function to get the current user (client-side)
export async function getCurrentUser() {
  const supabase = createBrowserClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.log("Error getting session:", error.message)
      return null
    }

    return session?.user || null
  } catch (error) {
    console.error("Unexpected error getting current user:", error)
    return null
  }
}

// Helper function to get a user's profile
export async function getUserProfile(userId: string) {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error getting user profile:", error.message)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error getting user profile:", error)
    return null
  }
}

// Server-side Supabase client (for Server Actions)
export function createActionSupabaseClient() {
  return createBrowserClient()
}

"use client"

import { createBrowserClient } from "@supabase/ssr"
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
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Client-side Supabase client (browser)
export function createClient() {
  // For SSR, return a dummy client that won't persist anything
  if (typeof window === "undefined") {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  const supabase = createClient()

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
  const supabase = createClient()

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

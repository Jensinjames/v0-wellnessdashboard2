"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Ensure we're using environment variables correctly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file.")
}

// Create a singleton instance to avoid multiple instances
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const createClient = () => {
  if (supabaseClient) return supabaseClient

  // Create a new client if one doesn't exist
  supabaseClient = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)

  return supabaseClient
}

// Helper function to get the current user (client-side)
export async function getCurrentUser() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user:", error.message)
      return null
    }

    return data.user || null
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

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Singleton pattern for browser client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Create a single instance of the Supabase client
export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("This client should only be used in the browser")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // Only create a new client if one doesn't exist already
  if (!supabaseClient) {
    console.log("Creating new Supabase client instance")
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
  }

  return supabaseClient
}

// For server-side rendering or static generation
export function resetSupabaseClient() {
  supabaseClient = null
}

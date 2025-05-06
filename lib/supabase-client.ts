import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Singleton pattern for browser client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Supabase URL and anon key are required")
    throw new Error("Supabase URL and anon key are required")
  }

  if (typeof window === "undefined") {
    console.error("This client should only be used in the browser")
    throw new Error("This client should only be used in the browser")
  }

  try {
    if (!supabaseClient) {
      console.log("Creating new Supabase client")
      supabaseClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )
    }

    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}

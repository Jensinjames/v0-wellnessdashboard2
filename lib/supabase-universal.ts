import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Create a singleton instance for the browser
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient should only be called in the browser")
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return supabaseClient
}

// Hook for React components
export function useSupabase() {
  return getSupabaseClient()
}

// Reset the client (useful for testing and auth changes)
export function resetSupabaseClient() {
  supabaseClient = null
}

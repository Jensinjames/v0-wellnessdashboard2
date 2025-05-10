import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Create a singleton instance for the browser
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createBrowserSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseClient
}

// Reset the client (useful for testing and auth changes)
export function resetBrowserSupabaseClient() {
  supabaseClient = null
}

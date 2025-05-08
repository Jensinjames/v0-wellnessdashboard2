import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { getSupabaseCredentials } from "@/lib/env"

// Create a singleton instance
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseBrowserClient() {
  // Get Supabase credentials
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    })
    throw new Error(
      "Your project's URL and Key are required to create a Supabase client!\n\n" +
        "Check your Supabase project's API settings to find these values\n\n" +
        "https://supabase.com/dashboard/project/_/settings/api",
    )
  }

  // Return existing instance if available (singleton pattern)
  if (browserClient) {
    return browserClient
  }

  // Create new browser client
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        "x-application-name": "wellness-dashboard-client",
      },
    },
  })

  return browserClient
}

// Reset the client (useful for testing)
export function resetBrowserClient() {
  browserClient = null
}

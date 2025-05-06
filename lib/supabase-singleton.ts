import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Singleton pattern to ensure only one instance is created
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Server-side - we should use server client instead
    throw new Error("Use createServerSupabaseClient on the server")
  }

  if (!supabaseInstance) {
    // Debug log to track instance creation
    console.log("[Supabase] Creating new browser client instance")

    supabaseInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: "wellness-dashboard-auth",
        },
        global: {
          headers: {
            "x-application-name": "wellness-dashboard",
          },
        },
      },
    )
  }

  return supabaseInstance
}

// Reset function for testing purposes
export function resetSupabaseClient() {
  supabaseInstance = null
}

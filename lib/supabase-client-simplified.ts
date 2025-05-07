import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Global singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get the Supabase client singleton
 * Simplified implementation that ensures only one client instance is created
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required Supabase environment variables")
  }

  supabaseInstance = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "wellness-dashboard-auth",
      },
    },
  )

  return supabaseInstance
}

/**
 * Reset the Supabase client (useful for testing or when auth state changes)
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null
}

/**
 * Create a new Supabase client for server-side operations
 * This should be used in server components or API routes
 */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required Supabase environment variables")
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  })
}

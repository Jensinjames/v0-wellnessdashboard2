import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Check if Supabase is configured with required environment variables
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Get a Supabase client instance (singleton pattern)
 * For client-side usage, use createSupabaseBrowserClient() from supabase-browser.ts instead
 */
export function getSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    )
  }

  // For server environments or non-browser environments, create and return a new client each time
  if (typeof window === "undefined") {
    return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false, // Don't persist session on server
      },
    })
  }

  // For client-side, use singleton pattern
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  }

  return supabaseClient
}

/**
 * Create a new Supabase client (non-singleton)
 * Only use this for server-side operations where you need a fresh client
 * Do NOT use this on the client side
 */
export function createSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    )
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false, // Don't persist session for server-side clients
    },
  })
}

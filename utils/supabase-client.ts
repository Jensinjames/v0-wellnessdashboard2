import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Declare global type for the cached client
declare global {
  var __supabase: SupabaseClient<Database> | undefined
}

/**
 * Returns the shared Supabase client.
 * - In the browser, reuses globalThis.__supabase (no Console logs).
 * - On the server, always creates a fresh client.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    // Client-side: Use cached instance
    if (!globalThis.__supabase) {
      // Silent initialization - no console logs
      globalThis.__supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
            storageKey: "wellness-dashboard-auth-v3",
          },
        },
      )
    }
    return globalThis.__supabase
  }

  // Server-side: Create a new client each time (no caching needed)
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

/**
 * Reset the client (useful for testing)
 */
export function resetSupabaseClient(): void {
  if (typeof window !== "undefined") {
    globalThis.__supabase = undefined
  }
}

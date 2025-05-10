/**
 * Supabase Admin Client
 * SERVER-ONLY - Contains service role key and should never be used on the client
 */

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { serverEnv } from "@/lib/env-config"

// Ensure this file is only imported on the server
if (typeof window !== "undefined") {
  throw new Error("lib/supabase-admin.ts should only be used on the server")
}

/**
 * Creates a Supabase admin client with the service role key
 * This should ONLY be used on the server for admin operations
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  // Validate environment variables
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variables for Supabase admin client")
  }

  return createClient<Database>(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

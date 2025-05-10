/**
 * Middleware-specific Supabase client utilities
 */
import { createClient } from "@supabase/supabase-js"
import { validateMiddlewareEnv } from "./env-config"
import type { Database } from "@/types/database"

/**
 * Create a Supabase client for middleware
 * This uses a simplified approach that works in the edge runtime
 */
export function createMiddlewareClient() {
  // Validate environment variables
  const { valid, missing } = validateMiddlewareEnv()
  if (!valid) {
    console.error(`Middleware: Missing Supabase environment variables: ${missing.join(", ")}`)
    throw new Error(`Missing required Supabase environment variables: ${missing.join(", ")}`)
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
    },
  })
}

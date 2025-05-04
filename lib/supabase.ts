import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

// Singleton instance for client components
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

/**
 * Returns a singleton instance of the Supabase client for client components
 * @returns Supabase client instance
 */
export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>()
  }
  return clientInstance
}

/**
 * @deprecated Use getSupabaseClient() instead
 * Alias for getSupabaseClient for backward compatibility
 */
export const createClient = getSupabaseClient

/**
 * Check if Supabase is properly configured
 * @returns boolean indicating if Supabase environment variables are set
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * @deprecated Use getSupabaseClient() instead
 * Direct access to the Supabase client (legacy support)
 */
export const supabase = getSupabaseClient()

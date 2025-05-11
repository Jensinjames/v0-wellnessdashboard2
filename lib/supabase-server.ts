import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseServer")

let serverClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Creates a Supabase client for server-side operations with the service role
 * This client bypasses RLS and should only be used in server contexts
 */
export function createServerClient() {
  try {
    // Return existing client if already initialized
    if (serverClient) {
      return serverClient
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables for server client")
    }

    serverClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-client-info": "server-admin",
        },
      },
    })

    return serverClient
  } catch (error) {
    logger.error("Error creating server Supabase client:", error)
    throw new Error("Failed to initialize Supabase server client")
  }
}

/**
 * Reset the server client - useful for testing
 */
export function resetServerClient() {
  serverClient = null
}

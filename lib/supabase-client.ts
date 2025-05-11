import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseClient")

// Store the client instance
let supabaseClient: SupabaseClient<Database> | null = null
let clientInitialized = false
let clientId = `client-${Date.now()}`

/**
 * Get a Supabase client for client components
 * Uses a singleton pattern to avoid multiple instances
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!clientInitialized) {
    try {
      logger.debug(`Initializing Supabase client (${clientId})`)

      // Check if required environment variables are available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables")
      }

      supabaseClient = createClientComponentClient<Database>({
        supabaseUrl,
        supabaseKey,
        options: {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
          },
          global: {
            headers: {
              "x-client-id": clientId,
              "x-client-info": `wellness-dashboard/${process.env.NEXT_PUBLIC_APP_VERSION || "unknown"}`,
            },
          },
        },
      })

      clientInitialized = true
      logger.info(`Supabase client initialized (${clientId})`)
    } catch (error) {
      logger.error("Error initializing Supabase client:", error)
      throw new Error("Failed to initialize Supabase client")
    }
  }

  return supabaseClient!
}

/**
 * Reset the Supabase client
 * Useful for testing or when you need a fresh client
 */
export function resetSupabaseClient(): void {
  logger.debug(`Resetting Supabase client (${clientId})`)
  supabaseClient = null
  clientInitialized = false
  clientId = `client-${Date.now()}`
}

/**
 * Get client status for debugging
 */
export function getClientStatus() {
  return {
    hasInstance: !!supabaseClient,
    clientId,
    initialized: clientInitialized,
  }
}

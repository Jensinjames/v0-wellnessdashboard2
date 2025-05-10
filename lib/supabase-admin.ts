import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { SERVER_ENV, validateServerEnv } from "./secure-env-config"
import { isServer } from "@/utils/environment"

// Singleton instance for the admin client
let adminClient: SupabaseClient<Database> | null = null

/**
 * Creates a Supabase admin client with service role privileges
 * This should ONLY be used server-side in secure contexts
 */
export function createSupabaseAdmin(): SupabaseClient<Database> {
  // Ensure this is only called server-side
  if (!isServer()) {
    throw new Error("Supabase admin client can only be created server-side")
  }

  // Validate environment variables
  const validation = validateServerEnv()
  if (!validation.valid) {
    throw new Error(`Missing required server environment variables: ${validation.missing.join(", ")}`)
  }

  // Check for service role key
  if (!SERVER_ENV.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
  }

  // Return existing instance if available
  if (adminClient) {
    return adminClient
  }

  // Create new admin client with service role
  adminClient = createClient<Database>(SERVER_ENV.SUPABASE_URL!, SERVER_ENV.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

/**
 * Resets the admin client
 * Useful for testing
 */
export function resetAdminClient(): void {
  adminClient = null
}

/**
 * Safely executes an admin operation with proper error handling
 */
export async function executeAdminOperation<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Ensure we're server-side
    if (!isServer()) {
      return {
        data: null,
        error: new Error("Admin operations can only be executed server-side"),
      }
    }

    // Get admin client
    const admin = createSupabaseAdmin()

    // Execute the operation
    const result = await operation(admin)

    return {
      data: result,
      error: null,
    }
  } catch (error) {
    console.error("Admin operation error:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

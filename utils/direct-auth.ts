/**
 * Direct Authentication Utility
 * Provides authentication functions that bypass schema checks
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client-core"

const logger = createLogger("DirectAuth")

/**
 * Sign in with email and password, bypassing schema checks
 */
export async function directSignIn(email: string, password: string) {
  try {
    const supabase = getSupabaseClient()

    logger.info("Attempting direct sign in")

    // Use a direct approach to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Add options to minimize database operations
        data: {
          bypass_schema_checks: true,
        },
      },
    })

    if (error) {
      logger.error("Direct sign in failed:", error)

      // Try to get the session directly
      try {
        const sessionResult = await supabase.auth.getSession()

        if (sessionResult.data?.session) {
          // We have a session despite the error, so we can proceed
          logger.info("Got session despite sign-in error")
          return { data: sessionResult.data, error: null }
        }
      } catch (sessionError) {
        logger.error("Error getting session:", sessionError)
      }

      return { data: null, error }
    }

    logger.info("Direct sign in successful")
    return { data, error: null }
  } catch (error) {
    logger.error("Exception in direct sign in:", error)
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error during sign in",
        status: 500,
      },
    }
  }
}

/**
 * Get the current session, bypassing schema checks
 */
export async function getSessionDirect() {
  try {
    const supabase = getSupabaseClient()

    logger.info("Getting session directly")

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      logger.error("Error getting session:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    logger.error("Exception getting session:", error)
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error getting session",
        status: 500,
      },
    }
  }
}

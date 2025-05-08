/**
 * Auth Fallback
 * Provides authentication functionality that doesn't rely on the user_changes_log table
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("AuthFallback")

/**
 * Sign in with email and password
 * This function doesn't rely on the user_changes_log table
 */
export async function signInWithEmailPassword(email: string, password: string) {
  try {
    const supabase = getSupabaseClient()

    logger.info("Attempting fallback sign in")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.error("Fallback sign in failed:", error)
      return { data: null, error }
    }

    logger.info("Fallback sign in successful")
    return { data, error: null }
  } catch (error) {
    logger.error("Exception in fallback sign in:", error)
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
 * Sign up with email and password
 * This function doesn't rely on the user_changes_log table
 */
export async function signUpWithEmailPassword(email: string, password: string) {
  try {
    const supabase = getSupabaseClient()

    logger.info("Attempting fallback sign up")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      logger.error("Fallback sign up failed:", error)
      return { data: null, error }
    }

    logger.info("Fallback sign up successful")
    return { data, error: null }
  } catch (error) {
    logger.error("Exception in fallback sign up:", error)
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error during sign up",
        status: 500,
      },
    }
  }
}

/**
 * Sign out
 * This function doesn't rely on the user_changes_log table
 */
export async function signOut() {
  try {
    const supabase = getSupabaseClient()

    logger.info("Attempting fallback sign out")

    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error("Fallback sign out failed:", error)
      return { error }
    }

    logger.info("Fallback sign out successful")
    return { error: null }
  } catch (error) {
    logger.error("Exception in fallback sign out:", error)
    return {
      error: {
        message: error instanceof Error ? error.message : "Unknown error during sign out",
        status: 500,
      },
    }
  }
}

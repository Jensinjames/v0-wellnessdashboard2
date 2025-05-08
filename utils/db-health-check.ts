/**
 * Database Health Check Utility
 * Provides functions to check if the database is properly set up
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client-core"

const logger = createLogger("DbHealthCheck")

/**
 * Check if the database is accessible
 */
export async function isDatabaseAccessible(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Try a simple query that doesn't rely on specific tables
    const { data, error } = await supabase.rpc("get_service_status")

    if (error) {
      // Try a different approach if RPC fails
      try {
        // Try to get the current timestamp from the database
        const { error: timestampError } = await supabase.from("_dummy_query").select("*").limit(1)

        // If the error is just that the table doesn't exist, the database is accessible
        return timestampError && timestampError.message.includes("does not exist")
      } catch (fallbackError) {
        logger.error("Error in fallback database check:", fallbackError)
        return false
      }
    }

    return true
  } catch (error) {
    logger.error("Error checking database accessibility:", error)
    return false
  }
}

/**
 * Check if authentication is working properly
 */
export async function isAuthWorking(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Try to get the current session
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      logger.error("Error checking auth:", error)
      return false
    }

    return true
  } catch (error) {
    logger.error("Error checking auth:", error)
    return false
  }
}

/**
 * Check if the user_changes_log table exists
 */
export async function doesUserChangesLogExist(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Try to select from the user_changes_log table
    const { error } = await supabase.from("user_changes_log").select("*").limit(1)

    // If there's no error, the table exists
    if (!error) {
      return true
    }

    // If the error is that the table doesn't exist, return false
    if (error.message.includes("does not exist")) {
      return false
    }

    // For other errors, log and return false
    logger.error("Error checking user_changes_log table:", error)
    return false
  } catch (error) {
    logger.error("Error checking user_changes_log table:", error)
    return false
  }
}

/**
 * Check Auth API Utility
 * Provides functions to check if we can use the Supabase Auth API
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("CheckAuthApi")

/**
 * Check if we can use the Supabase Auth API
 */
export async function canUseAuthApi(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    logger.info("Checking if we can use the Auth API")

    // Try to get the session
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      logger.error("Error using Auth API:", error)
      return false
    }

    logger.info("Auth API check passed")
    return true
  } catch (error) {
    logger.error("Error checking Auth API:", error)
    return false
  }
}

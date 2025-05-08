/**
 * Check REST API Utility
 * Provides functions to check if we can use the Supabase REST API
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("CheckRestApi")

/**
 * Check if we can use the Supabase REST API
 */
export async function canUseRestApi(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    logger.info("Checking if we can use the REST API")

    // Try to use the storage API
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      logger.error("Error using storage API:", error)
      return false
    }

    logger.info("REST API check passed")
    return true
  } catch (error) {
    logger.error("Error checking REST API:", error)
    return false
  }
}

/**
 * Check Storage API Utility
 * Provides functions to check if we can use the Supabase Storage API
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("CheckStorageApi")

/**
 * Check if we can use the Supabase Storage API
 */
export async function canUseStorageApi(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    logger.info("Checking if we can use the Storage API")

    // Try to list buckets
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      logger.error("Error using Storage API:", error)
      return false
    }

    logger.info("Storage API check passed")
    return true
  } catch (error) {
    logger.error("Error checking Storage API:", error)
    return false
  }
}

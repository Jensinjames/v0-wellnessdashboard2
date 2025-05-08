/**
 * Check Database API Utility
 * Provides functions to check if we can use the Supabase Database API
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("CheckDatabaseApi")

/**
 * Check if we can use the Supabase Database API
 */
export async function canUseDatabaseApi(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    logger.info("Checking if we can use the Database API")

    // Try to query the system schema
    const { data, error } = await supabase
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "public")
      .limit(1)

    // If we get an error about permissions, try a simpler approach
    if (error && error.message.includes("permission denied")) {
      // Try to query a public table
      const { error: publicError } = await supabase.from("logs").select("*").limit(1)

      // If the error is just that the table doesn't exist, that's fine
      if (!publicError || publicError.message.includes("does not exist")) {
        logger.info("Database API check passed with public table")
        return true
      }

      logger.error("Error using Database API with public table:", publicError)
      return false
    }

    if (error) {
      logger.error("Error using Database API:", error)
      return false
    }

    logger.info("Database API check passed")
    return true
  } catch (error) {
    logger.error("Error checking Database API:", error)
    return false
  }
}

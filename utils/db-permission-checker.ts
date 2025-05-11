import { getSupabaseClient } from "@/lib/supabase-client"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBPermissionChecker")

/**
 * Check if the user_changes_log table exists
 * This table is often referenced in RLS policies and can cause grant errors if missing
 */
export async function checkUserChangesLogTable(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Check if the table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "user_changes_log")
      .single()

    if (error) {
      logger.error("Error checking user_changes_log table:", error)
      return false
    }

    return !!data
  } catch (error) {
    logger.error("Unexpected error checking user_changes_log table:", error)
    return false
  }
}

/**
 * Create the user_changes_log table if it doesn't exist
 * This can help resolve database grant errors
 */
export async function createUserChangesLogTable(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Create the table
    const { error } = await supabase.rpc("create_user_changes_log_table")

    if (error) {
      logger.error("Error creating user_changes_log table:", error)
      return false
    }

    return true
  } catch (error) {
    logger.error("Unexpected error creating user_changes_log table:", error)
    return false
  }
}

/**
 * Check and fix database permissions
 * This can help resolve database grant errors
 */
export async function checkAndFixDatabasePermissions(): Promise<boolean> {
  try {
    // Check if the table exists
    const tableExists = await checkUserChangesLogTable()

    if (!tableExists) {
      // Create the table
      const created = await createUserChangesLogTable()

      if (!created) {
        logger.error("Failed to create user_changes_log table")
        return false
      }

      logger.info("Created user_changes_log table")
    }

    return true
  } catch (error) {
    logger.error("Unexpected error checking and fixing database permissions:", error)
    return false
  }
}

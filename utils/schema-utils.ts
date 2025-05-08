/**
 * Schema Utilities
 * Provides functions to fix database schema issues
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

// Create a dedicated logger for schema operations
const logger = createLogger("SchemaUtils")

/**
 * Fix schema issues in the database
 * This function attempts to create missing tables and fix permissions
 */
export async function fixSchemaIssue(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info("Attempting to fix schema issues")

    // Since we can't directly execute SQL via RPC, we'll use the API endpoint
    return await callFixSchemaAPI()
  } catch (error) {
    logger.error("Error fixing schema:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Call the API endpoint to fix schema issues
 */
async function callFixSchemaAPI(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info("Calling fix-schema API endpoint")

    // Call the API endpoint to fix schema issues
    const response = await fetch("/api/fix-schema", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "fix_schema",
        tables: ["user_changes_log"],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error("Schema fix API returned error", { status: response.status, error: errorData })
      return {
        success: false,
        error: errorData.message || `API returned status ${response.status}`,
      }
    }

    const data = await response.json()
    logger.info("Schema fix completed successfully", data)

    return { success: true }
  } catch (error) {
    logger.error("Error calling fix-schema API:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Check if a table exists in the database
 * Uses a safer approach that doesn't rely on information_schema
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Use a safer approach to check if table exists
    try {
      // Try to select 0 rows from the table - if it doesn't exist, it will error
      const { error } = await supabase.from(tableName).select("*").limit(0)

      // If there's no error, the table exists
      if (!error) {
        return true
      }

      // Check if the error is because the table doesn't exist
      if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
        return false
      }

      // For other errors, log and assume table doesn't exist to be safe
      logger.error(`Error checking if table ${tableName} exists:`, error)
      return false
    } catch (error) {
      logger.error(`Exception checking if table ${tableName} exists:`, error)
      return false
    }
  } catch (error) {
    logger.error(`Error in checkTableExists:`, error)
    return false
  }
}

/**
 * Get schema version from the database
 */
export async function getSchemaVersion(): Promise<string> {
  try {
    const response = await fetch("/api/schema-version")

    if (!response.ok) {
      return "unknown"
    }

    const data = await response.json()
    return data.version
  } catch (error) {
    logger.error("Error getting schema version:", error)
    return "unknown"
  }
}

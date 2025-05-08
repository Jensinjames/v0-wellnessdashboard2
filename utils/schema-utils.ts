/**
 * Schema Utilities
 * Provides functions to fix database schema issues
 */
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for schema operations
const logger = createLogger("SchemaUtils")

/**
 * Fix schema issues in the database
 * This function attempts to create missing tables and fix permissions
 */
export async function fixSchemaIssue(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info("Attempting to fix schema issues")

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
    logger.error("Error fixing schema:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Check if a table exists in the database
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/check-table?table=${encodeURIComponent(tableName)}`)

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.exists
  } catch (error) {
    logger.error(`Error checking if table ${tableName} exists:`, error)
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

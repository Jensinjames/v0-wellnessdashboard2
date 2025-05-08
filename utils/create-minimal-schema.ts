/**
 * Create Minimal Schema Utility
 * Provides functions to create a minimal schema
 */
import { createLogger } from "@/utils/logger"
import { createMinimalLogsTable } from "./create-minimal-logs"
import { canUseRestApi } from "./check-rest-api"

const logger = createLogger("CreateMinimalSchema")

/**
 * Create a minimal schema
 */
export async function createMinimalSchema(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info("Creating minimal schema")

    // Check if we can use the REST API
    const canUseRest = await canUseRestApi()

    if (!canUseRest) {
      logger.error("Cannot use REST API")
      return { success: false, error: "Cannot use REST API" }
    }

    // Create a minimal logs table
    const { success, error } = await createMinimalLogsTable()

    if (!success) {
      logger.error("Error creating minimal logs table:", error)
      return { success: false, error }
    }

    logger.info("Minimal schema created successfully")
    return { success: true }
  } catch (error) {
    logger.error("Error creating minimal schema:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error creating minimal schema",
    }
  }
}

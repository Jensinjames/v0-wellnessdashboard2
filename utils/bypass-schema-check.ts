/**
 * Bypass Schema Check Utility
 * Provides functions to bypass schema checks during authentication
 */
import { createLogger } from "@/utils/logger"

const logger = createLogger("BypassSchemaCheck")

// Local storage key for bypass preference
const BYPASS_SCHEMA_KEY = "bypass_schema_checks"

/**
 * Set bypass schema checks preference
 */
export function setBypassSchemaChecks(bypass: boolean): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(BYPASS_SCHEMA_KEY, bypass ? "true" : "false")
      logger.info(`Bypass schema checks ${bypass ? "enabled" : "disabled"}`)
    }
  } catch (error) {
    logger.error("Error setting bypass schema checks preference:", error)
  }
}

/**
 * Get bypass schema checks preference
 */
export function getBypassSchemaChecks(): boolean {
  try {
    if (typeof window !== "undefined") {
      const bypass = localStorage.getItem(BYPASS_SCHEMA_KEY)
      return bypass === "true"
    }
    return false
  } catch (error) {
    logger.error("Error getting bypass schema checks preference:", error)
    return false
  }
}

/**
 * Clear bypass schema checks preference
 */
export function clearBypassSchemaChecks(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(BYPASS_SCHEMA_KEY)
      logger.info("Bypass schema checks preference cleared")
    }
  } catch (error) {
    logger.error("Error clearing bypass schema checks preference:", error)
  }
}

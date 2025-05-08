/**
 * Create Minimal Logs Utility
 * Provides functions to create a minimal logs table
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("CreateMinimalLogs")

/**
 * Create a minimal logs table
 */
export async function createMinimalLogsTable(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient()

    logger.info("Creating minimal logs table")

    // Check if the logs table already exists
    const { error: checkError } = await supabase.from("logs").select("*").limit(1)

    // If there's no error, the table already exists
    if (!checkError) {
      logger.info("Logs table already exists")
      return { success: true }
    }

    // If the error is not about the table not existing, log it
    if (!checkError.message.includes("relation") || !checkError.message.includes("does not exist")) {
      logger.error("Unexpected error checking logs table:", checkError)
      return { success: false, error: checkError.message }
    }

    // Create a minimal logs table
    const { error: createError } = await supabase.from("logs").insert([
      {
        message: "Logs table created",
        level: "info",
        timestamp: new Date().toISOString(),
      },
    ])

    if (createError && !createError.message.includes("already exists")) {
      logger.error("Error creating logs table:", createError)
      return { success: false, error: createError.message }
    }

    logger.info("Minimal logs table created successfully")
    return { success: true }
  } catch (error) {
    logger.error("Error creating minimal logs table:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error creating logs table",
    }
  }
}

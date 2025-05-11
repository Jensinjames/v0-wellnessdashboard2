import { createServerClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBPermissionFixer")

/**
 * Comprehensive utility to fix database permissions issues
 */
export async function fixDatabasePermissions(): Promise<{
  success: boolean
  message: string
}> {
  try {
    logger.info("Starting database permission fix process")

    // Step 1: Call the API endpoint to fix permissions
    const response = await fetch("/api/database/fix-permissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      logger.error("API call to fix permissions failed:", data)
      return {
        success: false,
        message: data.error || "Failed to fix database permissions via API",
      }
    }

    // Step 2: Verify the fix by checking if we can access the user_changes_log table
    try {
      const supabase = createServerClient()

      // Try to insert a test record to verify permissions
      const { error: insertError } = await supabase.rpc("exec_sql", {
        sql_query: `
          INSERT INTO public.user_changes_log (user_id, action, ip_address)
          VALUES (
            '00000000-0000-0000-0000-000000000000', 
            'permission_check', 
            '127.0.0.1'
          )
          ON CONFLICT DO NOTHING;
        `,
      })

      if (insertError) {
        logger.error("Verification insert failed:", insertError)
        return {
          success: false,
          message: "Fixed permissions but verification failed: " + insertError.message,
        }
      }

      logger.info("Database permissions fixed and verified successfully")
      return {
        success: true,
        message: "Database permissions fixed successfully",
      }
    } catch (verifyError) {
      logger.error("Error during verification:", verifyError)
      return {
        success: false,
        message: "Fixed permissions but verification failed",
      }
    }
  } catch (error) {
    logger.error("Unexpected error fixing database permissions:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

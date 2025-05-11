import { getSupabaseClient } from "@/lib/supabase-client"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBHealthChecker")

/**
 * Check if the database connection is healthy
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean
  details: Record<string, any>
}> {
  try {
    const supabase = getSupabaseClient()
    const details: Record<string, any> = {}

    // Check if we can connect to the database
    const { data: pingData, error: pingError } = await supabase.rpc("create_user_changes_log_table")

    details.pingSuccess = !pingError
    if (pingError) {
      details.pingError = pingError.message
    }

    // Check if the user_changes_log table exists
    const { data: tableData, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "user_changes_log")
      .maybeSingle()

    details.tableExists = !!tableData
    if (tableError) {
      details.tableError = tableError.message
    }

    // Check if we can get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    details.userSuccess = !userError
    details.hasUser = !!userData?.user
    if (userError) {
      details.userError = userError.message
    }

    // Overall health status
    const isHealthy = !pingError && !tableError && !userError

    return { isHealthy, details }
  } catch (error) {
    logger.error("Error checking database health:", error)
    return {
      isHealthy: false,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

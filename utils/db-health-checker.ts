import { createServerClient } from "@/lib/supabase-server"
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
    const supabase = createServerClient()
    const details: Record<string, any> = {}

    // Check if we can connect to the database
    const { data: pingData, error: pingError } = await supabase.rpc("exec_sql", {
      sql_query: "SELECT 1 as ping",
    })

    details.pingSuccess = !pingError && pingData?.length > 0
    if (pingError) {
      details.pingError = pingError.message
    }

    // Check if the user_changes_log table exists
    const { data: tableData, error: tableError } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_changes_log'
        ) as exists;
      `,
    })

    details.tableExists = tableData?.[0]?.exists || false
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

    // Check RLS policies
    const { data: policiesData, error: policiesError } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT COUNT(*) as count
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_changes_log';
      `,
    })

    details.policiesSuccess = !policiesError
    details.policiesCount = policiesData?.[0]?.count || 0
    if (policiesError) {
      details.policiesError = policiesError.message
    }

    // Overall health status
    const isHealthy =
      !pingError && !tableError && !userError && !policiesError && details.tableExists && details.policiesCount > 0

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

/**
 * Fix common database issues
 */
export async function fixDatabaseIssues(): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Call the API to fix database permissions
    const response = await fetch("/api/database/fix-permissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        message: data.error || "Failed to fix database issues",
      }
    }

    return {
      success: true,
      message: "Successfully fixed database issues",
    }
  } catch (error) {
    logger.error("Error fixing database issues:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

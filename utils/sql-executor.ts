/**
 * SQL Executor Utility
 * Provides functions to execute SQL statements directly
 */
import { createClient } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SQLExecutor")

/**
 * Execute SQL directly using the Supabase service role
 * WARNING: This should only be used in admin contexts
 */
export async function executeSQLAdmin(sql: string): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Check for required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Missing Supabase environment variables")
      return { success: false, error: "Server configuration error" }
    }

    // Create Supabase admin client
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Try to execute the SQL using the rpc function
    try {
      const { data, error } = await supabase.rpc("execute_sql", {
        sql_query: sql,
      })

      if (error) {
        logger.error("Error executing SQL:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      logger.error("Exception executing SQL:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  } catch (error) {
    logger.error("Unexpected error in SQL executor:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Check if the database has the execute_sql function
 */
export async function hasExecuteSQLFunction(): Promise<boolean> {
  try {
    // Check for required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Missing Supabase environment variables")
      return false
    }

    // Create Supabase admin client
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Try to call the function with a simple query
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: "SELECT 1 as test",
    })

    return !error
  } catch (error) {
    logger.error("Error checking execute_sql function:", error)
    return false
  }
}

/**
 * Create the execute_sql function if it doesn't exist
 */
export async function createExecuteSQLFunction(): Promise<boolean> {
  try {
    // Check for required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Missing Supabase environment variables")
      return false
    }

    // Create Supabase admin client
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // SQL to create the function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        EXECUTE sql_query;
        result := json_build_object('success', true);
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := json_build_object('success', false, 'error', SQLERRM);
        RETURN result;
      END;
      $$;
    `

    // Try to create the function
    const { error } = await supabase.rpc("execute_sql", {
      sql_query: createFunctionSQL,
    })

    if (error) {
      // If the function doesn't exist, we can't create it using RPC
      // Try a direct approach using the REST API
      logger.warn("Failed to create execute_sql function using RPC:", error)

      // Create a logs table to store the function creation attempt
      const { error: logsError } = await supabase.from("schema_logs").insert([
        {
          operation: "create_function",
          details: "Attempted to create execute_sql function",
          timestamp: new Date().toISOString(),
        },
      ])

      return false
    }

    return true
  } catch (error) {
    logger.error("Error creating execute_sql function:", error)
    return false
  }
}

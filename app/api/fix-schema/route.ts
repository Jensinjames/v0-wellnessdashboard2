/**
 * API Route to fix database schema issues
 */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for schema operations
const logger = createLogger("SchemaFixAPI")

export async function POST(request: Request) {
  try {
    // Validate request
    const body = await request.json()

    if (!body.action || body.action !== "fix_schema") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Create Supabase admin client
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user_changes_log table exists
    const { data: tableExists, error: checkError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "user_changes_log")
      .limit(1)

    if (checkError) {
      logger.error("Error checking if table exists:", checkError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // If table doesn't exist, create it
    if (!tableExists || tableExists.length === 0) {
      logger.info("Creating user_changes_log table")

      // Create the table
      const { error: createError } = await supabase.rpc("create_user_changes_log_table")

      if (createError) {
        logger.error("Error creating table:", createError)

        // Try direct SQL as fallback
        const { error: sqlError } = await supabase.rpc("execute_system_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS user_changes_log (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id),
              changed_by UUID REFERENCES auth.users(id),
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              action VARCHAR(255) NOT NULL,
              old_values JSONB,
              new_values JSONB,
              ip_address VARCHAR(255)
            );
            
            -- Add indexes for performance
            CREATE INDEX IF NOT EXISTS idx_user_changes_log_user_id ON user_changes_log(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_changes_log_created_at ON user_changes_log(created_at);
            
            -- Add RLS policies
            ALTER TABLE user_changes_log ENABLE ROW LEVEL SECURITY;
            
            -- Only allow admins to view the logs
            CREATE POLICY admin_all ON user_changes_log 
              USING (auth.jwt() ->> 'role' = 'service_role');
          `,
        })

        if (sqlError) {
          logger.error("Error executing SQL:", sqlError)
          return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
        }
      }
    }

    // Fix permissions for auth schema
    logger.info("Fixing auth schema permissions")
    const { error: permissionError } = await supabase.rpc("execute_system_sql", {
      sql: `
        -- Grant necessary permissions to authenticated users
        GRANT USAGE ON SCHEMA auth TO authenticated;
        GRANT SELECT ON auth.users TO authenticated;
        
        -- Ensure the postgres role has proper permissions
        GRANT ALL ON SCHEMA auth TO postgres;
        GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres;
      `,
    })

    if (permissionError) {
      logger.error("Error fixing permissions:", permissionError)
      return NextResponse.json({ error: "Failed to fix permissions" }, { status: 500 })
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "Schema fixed successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Unexpected error in fix-schema API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

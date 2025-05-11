import { createServerClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DirectDBFixer")

/**
 * Direct database fixer that addresses the root causes of grant errors
 */
export async function fixDatabaseGrantIssue(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    logger.info("Starting direct database grant fix")
    const supabase = createServerClient()

    // Step 1: Check if we can execute SQL at all
    const { data: pingData, error: pingError } = await supabase.rpc("exec_sql", {
      sql_query: "SELECT current_user, current_database()",
    })

    if (pingError) {
      logger.error("Cannot execute SQL - service role may be invalid:", pingError)
      return {
        success: false,
        message: "Cannot execute SQL with service role: " + pingError.message,
        details: pingError,
      }
    }

    logger.info("SQL execution check passed", pingData)

    // Step 2: Create a minimal schema that doesn't rely on complex RLS
    const { error: schemaError } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Create a minimal auth_status table that doesn't use RLS
        CREATE TABLE IF NOT EXISTS public.auth_status (
          id SERIAL PRIMARY KEY,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Make this table accessible to everyone
        GRANT SELECT ON public.auth_status TO anon, authenticated;
        
        -- Insert a record to verify it works
        INSERT INTO public.auth_status (status) 
        VALUES ('system_operational')
        ON CONFLICT DO NOTHING;
        
        -- Grant basic schema permissions
        GRANT USAGE ON SCHEMA public TO anon, authenticated;
        GRANT USAGE ON SCHEMA auth TO anon, authenticated;
        
        -- Grant execute on auth functions
        GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
        GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated;
        GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated;
      `,
    })

    if (schemaError) {
      logger.error("Error creating minimal schema:", schemaError)
      return {
        success: false,
        message: "Failed to create minimal schema: " + schemaError.message,
        details: schemaError,
      }
    }

    // Step 3: Create the user_changes_log table with simplified RLS
    const { error: tableError } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Create the user_changes_log table
        CREATE TABLE IF NOT EXISTS public.user_changes_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          action TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ip_address TEXT,
          old_values JSONB,
          new_values JSONB
        );
        
        -- Disable RLS temporarily to ensure we can insert a record
        ALTER TABLE public.user_changes_log DISABLE ROW LEVEL SECURITY;
        
        -- Insert a system record
        INSERT INTO public.user_changes_log (user_id, action, ip_address)
        VALUES (
          '00000000-0000-0000-0000-000000000000', 
          'system_init', 
          '0.0.0.0'
        )
        ON CONFLICT DO NOTHING;
        
        -- Grant permissions
        GRANT SELECT, INSERT ON public.user_changes_log TO authenticated;
        
        -- Re-enable RLS with simplified policies
        ALTER TABLE public.user_changes_log ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own logs" ON public.user_changes_log;
        DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_changes_log;
        
        -- Create simplified policies
        CREATE POLICY "Anyone can view system logs" 
          ON public.user_changes_log
          FOR SELECT
          USING (user_id = '00000000-0000-0000-0000-000000000000');
          
        CREATE POLICY "Authenticated users can insert logs" 
          ON public.user_changes_log
          FOR INSERT
          TO authenticated
          WITH CHECK (true);
      `,
    })

    if (tableError) {
      logger.error("Error creating user_changes_log table:", tableError)
      return {
        success: false,
        message: "Failed to create user_changes_log table: " + tableError.message,
        details: tableError,
      }
    }

    // Step 4: Verify we can query the tables
    const { data: verifyData, error: verifyError } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT 
          (SELECT COUNT(*) FROM public.auth_status) as auth_status_count,
          (SELECT COUNT(*) FROM public.user_changes_log) as user_changes_log_count
      `,
    })

    if (verifyError) {
      logger.error("Error verifying tables:", verifyError)
      return {
        success: false,
        message: "Failed to verify tables: " + verifyError.message,
        details: verifyError,
      }
    }

    logger.info("Database fix completed successfully", verifyData)
    return {
      success: true,
      message: "Database permissions fixed successfully",
      details: verifyData,
    }
  } catch (error) {
    logger.error("Unexpected error in direct database fix:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      details: error,
    }
  }
}
